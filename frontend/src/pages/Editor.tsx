import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Plus, Trash2, Play, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slide } from '../../types';
import SlideEditor from '../components/SlideEditor';
import { exportToPDF } from '../utils/pdfExport';
import '../styles/Editor.css';

export default function Editor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, currentProject, currentSlideIndex, setCurrentProject, setCurrentSlideIndex, addSlide, deleteSlide, duplicateSlide } = useApp();
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string } | null>(null);

  useEffect(() => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    } else {
      navigate('/');
    }
  }, [projectId, projects]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  const currentSlide = currentProject.slides[currentSlideIndex];

  if (!currentSlide) {
    return <div>Loading slide...</div>;
  }

  const handleAddSlide = async (template: Slide['template']) => {
    await addSlide(currentProject.id, template);
    setShowTemplates(false);
  };

  const handleDeleteSlide = async () => {
    if (currentProject.slides.length > 1 && confirm('このスライドを削除してもよろしいですか？')) {
      await deleteSlide(currentProject.id, currentSlide.id);
      if (currentSlideIndex >= currentProject.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
      }
    }
  };

  const handleDuplicateSlide = async () => {
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
    navigate(`/present/${currentProject.id}`);
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

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="btn-icon" onClick={() => navigate('/')} title="ホーム">
          <Home size={20} />
        </button>
        <h1 className="project-title">{currentProject.name}</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={18} />
            PDFエクスポート
          </button>
          <button className="btn-primary" onClick={handlePresent}>
            <Play size={18} />
            プレゼン開始
          </button>
          {/* <button className="btn-secondary" onClick={handleLogout} style={{ marginLeft: 8 }}>
            ログアウト
          </button> */}
        </div>
      </header>

      <div className="editor-container">
        <aside className="slides-sidebar">
          <div className="sidebar-header">
            <h3>スライド</h3>
            <button className="btn-icon" onClick={() => setShowTemplates(true)} title="スライドを追加">
              <Plus size={18} />
            </button>
          </div>
          <div className="slides-list">
            {currentProject.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
                onClick={() => setCurrentSlideIndex(index)}
                onContextMenu={(e) => handleContextMenu(e, slide.id)}
              >
                <div className="thumbnail-number">{index + 1}</div>
                <div className="thumbnail-content" style={{ backgroundColor: slide.backgroundColor, color: slide.textColor }}>
                  <div className="thumbnail-title">{slide.title}</div>
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
            <button className="btn-danger-outline" onClick={handleDeleteSlide}>
              <Trash2 size={18} />
              スライドを削除
            </button>
          </div>

          <SlideEditor slide={currentSlide} projectId={currentProject.id} />
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
    </div>
  );
}

