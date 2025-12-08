import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Plus, Trash2, Play, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slide } from '../../types';
import SlideEditor from '../components/SlideEditor';
import { exportToPDF } from '../utils/pdfExport';
import { genShareId, createSessionDoc, subscribeSession, writeSessionProject, getSessionOnce } from '../services/collab';
import '../styles/Editor.css';

export default function Editor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, currentProject, currentSlideIndex, setCurrentProject, setCurrentSlideIndex, addSlide, deleteSlide, duplicateSlide, currentUser } = useApp();
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string } | null>(null);

  // Collaborative state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareRole, setShareRole] = useState<'edit' | 'view'>('edit');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const sessionUnsubRef = useRef<(() => void) | null>(null);
  // client id to avoid echo
  const clientIdRef = useRef<string>(crypto && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2, 9));

  // Track if project is loaded to avoid stale closure in setTimeout
  const projectLoadedRef = useRef(false);

  useEffect(() => {
    const project = projects.find(p => p.id === projectId);
    const share = searchParams.get('share');
    if (project) {
      setCurrentProject(project);
      projectLoadedRef.current = true;
    } else if (!share) {
      // only navigate away when there's no share id — otherwise wait for joinSession to set project
      navigate('/');
    }
  }, [projectId, projects, searchParams]); // note: include searchParams

  // Error handling
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // auto-join if URL has ?share=...
  useEffect(() => {
    const s = searchParams.get('share');
    if (s) {
      console.log('Found share param:', s);
      setLoadingError(null);
      projectLoadedRef.current = false; // reset loading state

      // Set a timeout to show error if loading takes too long
      const timer = setTimeout(() => {
        // Use ref to check current status, preventing stale closure issue
        if (!projectLoadedRef.current) {
          console.warn('Loading timeout reached (15s) - Project not loaded');
          setLoadingError('読み込みに時間がかかっています。リンクが正しいか確認してください。');
        } else {
          console.log('Timeout check passed: Project is loaded');
        }
      }, 15000); // Extended to 15 seconds

      joinSession(s);

      return () => clearTimeout(timer);
    }
    return () => {
      // cleanup on unmount: unsubscribe session if exists
      if (sessionUnsubRef.current) {
        try { sessionUnsubRef.current(); } catch { }
        sessionUnsubRef.current = null;
        sessionIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // subscribe session -> apply remote updates to currentProject and role
  async function joinSession(sessionId: string) {
    console.log('Joining session:', sessionId);
    // unsubscribe previous
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    sessionIdRef.current = sessionId;

    // Try fetch session once immediately (so viewer sees content without waiting)
    try {
      console.log('Fetching session once...');
      const snap = await getSessionOnce(sessionId);
      console.log('fetchSessionOnce result:', snap);

      if (snap && snap.project) {
        // apply role/read-only logic from snapshot
        const role: 'edit' | 'view' = snap.role || 'edit';
        const ownerId: string | null = snap.ownerId || null;
        const isOwner = !!(currentUser && ownerId && currentUser.id === ownerId);
        setIsReadOnly(role === 'view' && !isOwner);
        setCurrentProject(snap.project);
        projectLoadedRef.current = true; // Mark as loaded
        console.log('Project loaded from snapshot');
      } else if (snap === null) {
        // explicitly null means not found
        console.warn('Session not found (snap is null)');
        setLoadingError('指定された共有スライドは見つかりませんでした。');
      }
    } catch (err) {
      console.warn('getSessionOnce failed', err);
    }

    // then subscribe for realtime/polling updates
    console.log('Subscribing to session...');
    const unsub = subscribeSession(sessionId, (data) => {
      console.log('Session update received:', data ? 'Data present' : 'Null');
      if (!data) {
        // session missing: wait for getSessionOnce to handle "not found" or keep waiting
        // if getSessionOnce already finished and found nothing, error is shown.
        // if this returns null late, it might mean deletion.
        return;
      }
      const role: 'edit' | 'view' = data.role || 'edit';
      const ownerId: string | null = data.ownerId || null;
      const isOwner = !!(currentUser && ownerId && currentUser.id === ownerId);
      setIsReadOnly(role === 'view' && !isOwner);

      // ignore updates originated from this client
      if (data.lastClient === clientIdRef.current) return;
      if (data.project) {
        setCurrentProject(data.project);
        projectLoadedRef.current = true; // Mark as loaded (in case snapshot failed but stream worked)
      }
    });
    sessionUnsubRef.current = unsub;
  }

  // create share session (owner) and subscribe
  async function handleCreateShare() {
    if (!currentProject) return;
    const sid = genShareId();
    const link = `${window.location.origin}/editor/${currentProject.id}?share=${sid}`;
    setShareLink(link);
    setShareError(null);
    setShareModalOpen(true);

    try {
      const ownerId = currentUser ? currentUser.id : undefined;
      await createSessionDoc(sid, currentProject, shareRole, ownerId);
      await joinSession(sid);
    } catch (err) {
      console.error('Failed to create share session', err);
      setShareError('共有セッションの作成に失敗しました。オフラインリンクを作成しました。再試行できます。');
    }
  }

  // when local currentProject changes, push to session (if any and if editable)
  useEffect(() => {
    if (!sessionIdRef.current) return;
    if (!currentProject) return;
    // do not push if read-only local client
    if (isReadOnly) return;
    (async () => {
      try {
        await writeSessionProject(sessionIdRef.current as string, currentProject, clientIdRef.current);
      } catch (err) {
        console.error('Failed to write session project', err);
      }
    })();
  }, [currentProject, isReadOnly]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (loadingError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>エラー</h2>
        <p>{loadingError}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>ホームへ戻る</button>
      </div>
    );
  }

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  const currentSlide = currentProject.slides[currentSlideIndex];

  if (!currentSlide) {
    return <div>Loading slide...</div>;
  }

  const handleAddSlide = async (template: Slide['template']) => {
    if (isReadOnly) return;
    await addSlide(currentProject.id, template);
    setShowTemplates(false);
  };

  const handleDeleteSlide = async () => {
    if (isReadOnly) return;
    if (currentProject.slides.length > 1 && confirm('このスライドを削除してもよろしいですか？')) {
      await deleteSlide(currentProject.id, currentSlide.id);
      if (currentSlideIndex >= currentProject.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
      }
    }
  };

  const handleDuplicateSlide = async () => {
    if (isReadOnly) return;
    if (contextMenu) {
      await duplicateSlide(currentProject.id, contextMenu.slideId);
      setContextMenu(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, slideId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      slideId
    });
  };

  const handlePresent = () => {
    if (searchParams.get('share')) {
      navigate(`/present/${currentProject.id}?share=${searchParams.get('share')}`);
    } else {
      navigate(`/present/${currentProject.id}`);
    }
  };

  const handleExport = async () => {
    await exportToPDF(currentProject);
  };

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  const templates: Array<{ id: Slide['template']; name: string; description: string }> = [
    { id: 'blank', name: '空白', description: 'ゼロから作成' },
    { id: 'title', name: 'タイトル', description: '中央揃えの大きなタイトル' },
    { id: 'title-content', name: 'タイトルと内容', description: 'タイトルと本文' },
    { id: 'two-column', name: '2カラム', description: '2列のレイアウト' },
    { id: 'image-text', name: '画像とテキスト', description: '画像と説明文' },
  ];

  // render: add Share button in header and share modal with role selector
  return (
    <div className="editor">
      <header className="editor-header">
        <button className="btn-icon" onClick={() => navigate('/')} title="ホーム">
          <Home size={20} />
        </button>
        <h1 className="project-title">{currentProject.name}{isReadOnly ? ' (閲覧専用)' : ''}</h1>
        <div className="header-actions">
          {!isReadOnly && (
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={18} />
              PDFエクスポート
            </button>
          )}
          <button className="btn-primary" onClick={handlePresent}>
            <Play size={18} />
            プレゼン開始
          </button>

          <button className="btn-secondary" onClick={() => setShareModalOpen(true)} style={{ marginLeft: 8 }}>
            共有
          </button>
        </div>
      </header>

      <div className="editor-container">
        <aside className="slides-sidebar">
          <div className="sidebar-header">
            <h3>スライド</h3>
            {!isReadOnly && (
              <button className="btn-icon" onClick={() => setShowTemplates(true)} title="スライドを追加">
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="slides-list">
            {currentProject.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
                onClick={() => setCurrentSlideIndex(index)}
                onContextMenu={(e) => { if (!isReadOnly) handleContextMenu(e, slide.id); }}
              >
                <div className="thumbnail-number">{index + 1}</div>
                <div className="thumbnail-content" style={{ backgroundColor: slide.backgroundColor, color: slide.textColor }}>
                  {(() => {
                    // Mini-render logic
                    const titleStyle: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 'bold', textAlign: 'center', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };
                    const textStyle: React.CSSProperties = { fontSize: '0.4rem', flex: 1, overflow: 'hidden', width: '100%' };

                    switch (slide.template) {
                      case 'title':
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <div style={titleStyle}>{slide.title || 'タイトル'}</div>
                          </div>
                        );
                      case 'title-content':
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '2px' }}>
                            <div style={{ ...titleStyle, flex: '0 0 auto', textAlign: 'left' }}>{slide.title || 'タイトル'}</div>
                            <div style={textStyle}>{slide.content || 'クリックして編集'}</div>
                          </div>
                        );
                      case 'two-column':
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '2px' }}>
                            <div style={{ ...titleStyle, flex: '0 0 auto', textAlign: 'left' }}>{slide.title || 'タイトル'}</div>
                            <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
                              <div style={{ flex: 1, fontSize: '0.3rem', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>列1</div>
                              <div style={{ borderLeft: '1px solid #eee', width: 0 }}></div>
                              <div style={{ flex: 1, fontSize: '0.3rem', overflow: 'hidden' }}>{slide.content || '本文'}</div>
                            </div>
                          </div>
                        );
                      case 'image-text':
                        return (
                          <div style={{ display: 'flex', height: '100%', width: '100%', gap: '4px', alignItems: 'center' }}>
                            <div style={{ width: '40%', height: '80%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {slide.imageUrl ? <img src={slide.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.5rem' }}>📷</span>}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ ...titleStyle, textAlign: 'left', fontSize: '0.5rem' }}>{slide.title || 'タイトル'}</div>
                              <div style={{ ...textStyle, fontSize: '0.3rem', height: '2em' }}>{slide.content || '本文'}</div>
                            </div>
                          </div>
                        );
                      case 'blank':
                      default:
                        return (
                          <div style={{ width: '100%', height: '100%', padding: '2px', fontSize: '0.4rem', overflow: 'hidden' }}>
                            {slide.content || '空白'}
                          </div>
                        );
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="editor-main">
          <div className="editor-toolbar">
            <button
              className="btn-icon"
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="slide-indicator">
              スライド {currentSlideIndex + 1} / {currentProject.slides.length}
            </span>
            <button
              className="btn-icon"
              onClick={() => setCurrentSlideIndex(Math.min(currentProject.slides.length - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === currentProject.slides.length - 1}
            >
              <ChevronRight size={20} />
            </button>
            <div className="spacer"></div>
            {!isReadOnly && (
              <button className="btn-danger-outline" onClick={handleDeleteSlide}>
                <Trash2 size={18} />
                スライドを削除
              </button>
            )}
          </div>

          {/* pass readOnly prop to SlideEditor so it can disable editing UI */}
          <SlideEditor slide={currentSlide} projectId={currentProject.id} readOnly={isReadOnly} />
        </main>
      </div>

      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal templates-modal" onClick={(e) => e.stopPropagation()}>
            <h2>テンプレートを選択</h2>
            <div className="templates-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => handleAddSlide(template.id)}
                >
                  <div className={`template-preview template-${template.id}`}>
                    <div className="preview-content">
                      {template.id === 'title' && <div className="preview-title">Title</div>}
                      {template.id === 'title-content' && (
                        <>
                          <div className="preview-title-small">Title</div>
                          <div className="preview-text">Content</div>
                        </>
                      )}
                      {template.id === 'two-column' && (
                        <div className="preview-columns">
                          <div className="preview-col">Column 1</div>
                          <div className="preview-col">Column 2</div>
                        </div>
                      )}
                      {template.id === 'image-text' && (
                        <div className="preview-image-text">
                          <div className="preview-image">📷</div>
                          <div className="preview-text-small">Text</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '8px 0',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            className="context-menu-item"
            onClick={handleDuplicateSlide}
          >
            スライドを複製
          </button>
        </div>
      )}

      {/* Share modal */}
      {shareModalOpen && (
        <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>プロジェクトを共有</h2>
            <p>共有リンクの権限を選択してください。</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" checked={shareRole === 'edit'} onChange={() => setShareRole('edit')} />
                編集可能
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" checked={shareRole === 'view'} onChange={() => setShareRole('view')} />
                閲覧のみ
              </label>
            </div>

            <div style={{ marginBottom: 8 }}>
              <button className="btn-primary" onClick={handleCreateShare}>リンクを作成</button>
            </div>

            {shareLink && (
              <>
                <p>共有リンク:</p>
                <input type="text" readOnly value={shareLink} style={{ width: '100%' }} />
                {shareError && (
                  <div style={{ marginTop: 8, color: 'red' }}>{shareError}</div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="btn-primary" onClick={async () => {
                    if (shareLink) {
                      await navigator.clipboard.writeText(shareLink);
                      alert('共有リンクをコピーしました');
                    }
                  }}>コピー</button>
                  <button className="btn-secondary" onClick={() => setShareModalOpen(false)}>閉じる</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

