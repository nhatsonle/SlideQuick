import { useState, useEffect, useRef } from "react";
import { Send, Settings, MessageSquare } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Slide } from "../../types";
import "../styles/SlideEditor.css";

interface SlideEditorProps {
  slide: Slide;
  projectId: string;
  readOnly?: boolean;
  messages?: Array<{ id: string; sender: string; text: string; timestamp: number }>;
  onSendMessage?: (text: string) => Promise<void>;
  username?: string;
}

export default function SlideEditor({ slide, projectId, readOnly = false, messages = [], onSendMessage, username }: SlideEditorProps) {
  const { updateSlide } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'chat'>('settings');
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Switch to chat if readOnly (since settings are hidden/disabled) but allow toggling if implementation desires.
  // Actually, let's default to 'chat' if readOnly, 'settings' otherwise, but user can switch.
  useEffect(() => {
    if (readOnly) setActiveTab('chat');
  }, [readOnly]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !onSendMessage) return;
    try {
      await onSendMessage(chatInput.trim());
      setChatInput("");
    } catch (e) {
      console.error(e);
    }
  };
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for inputs to prevent focus loss and reduce server calls
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localContent, setLocalContent] = useState(slide.content);

  // Sync local state when slide changes (e.g. navigation)
  useEffect(() => {
    setLocalTitle(slide.title);
    setLocalContent(slide.content);
  }, [slide.id, slide.title, slide.content]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (!readOnly && localTitle !== slide.title) {
      updateSlide(projectId, slide.id, { title: localTitle });
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (!readOnly && localContent !== slide.content) {
      updateSlide(projectId, slide.id, { content: localContent });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");

      const data = await res.json();
      updateSlide(projectId, slide.id, { imageUrl: data.url });
    } catch (error) {
      console.error("Upload error:", error);
      alert("画像のアップロードに失敗しました");
    }
  };

  const renderSlideContent = () => {
    switch (slide.template) {
      case "title":
        return (
          <div className="slide-template-title">
            {isEditingTitle && !readOnly ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                autoFocus
                className="slide-input-large"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h1
                onClick={() => !readOnly && setIsEditingTitle(true)}
                style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
              >
                {localTitle}
              </h1>
            )}
          </div>
        );

      case "title-content":
        return (
          <div className="slide-template-title-content">
            {isEditingTitle && !readOnly ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                autoFocus
                className="slide-input"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h2
                onClick={() => !readOnly && setIsEditingTitle(true)}
                style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
              >
                {localTitle}
              </h2>
            )}
            {isEditingContent && !readOnly ? (
              <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleContentBlur}
                autoFocus
                className="slide-textarea"
                style={{ color: slide.textColor }}
              />
            ) : (
              <div
                onClick={() => !readOnly && setIsEditingContent(true)}
                className="slide-content"
                style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
              >
                {localContent}
              </div>
            )}
          </div>
        );

      case "two-column":
        return (
          <div className="slide-template-two-column">
            {isEditingTitle && !readOnly ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                autoFocus
                className="slide-input"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h2
                onClick={() => !readOnly && setIsEditingTitle(true)}
                style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
              >
                {localTitle}
              </h2>
            )}
            <div className="two-columns">
              {isEditingContent && !readOnly ? (
                <textarea
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleContentBlur}
                  autoFocus
                  className="slide-textarea"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <div
                  onClick={() => !readOnly && setIsEditingContent(true)}
                  className="slide-content"
                  style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
                >
                  {localContent}
                </div>
              )}
            </div>
          </div>
        );

      case "image-text":
        return (
          <div className="slide-template-image-text">
            <div
              className="image-placeholder"
              style={{ borderColor: slide.textColor, cursor: readOnly ? "default" : "pointer", overflow: "hidden" }}
              onClick={() => !readOnly && fileInputRef.current?.click()}
            >
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="Slide" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: slide.textColor }}>{readOnly ? '' : '📷 画像を選択'}</span>
              )}
              {!readOnly && (
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              )}
            </div>
            <div className="text-section">
              {isEditingTitle && !readOnly ? (
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  autoFocus
                  className="slide-input"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <h2
                  onClick={() => !readOnly && setIsEditingTitle(true)}
                  style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
                >
                  {localTitle}
                </h2>
              )}
              {isEditingContent && !readOnly ? (
                <textarea
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleContentBlur}
                  autoFocus
                  className="slide-textarea"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <div
                  onClick={() => !readOnly && setIsEditingContent(true)}
                  className="slide-content"
                  style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
                >
                  {localContent}
                </div>
              )}
            </div>
          </div>
        );

      case "blank":
      default:
        return (
          <div className="slide-template-blank">
            {isEditingContent && !readOnly ? (
              <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleContentBlur}
                autoFocus
                className="slide-textarea-full"
                style={{ color: slide.textColor }}
              />
            ) : (
              <div
                onClick={() => !readOnly && setIsEditingContent(true)}
                className="slide-content-full"
                style={{ color: slide.textColor, cursor: readOnly ? 'default' : 'text' }}
              >
                {localContent || (readOnly ? "" : "クリックして編集")}
              </div>
            )}
          </div>
        );
    }
  };

  const { updateSlide: updateSlideDirect } = useApp();
  const handleColorUpdate = (updates: Partial<Slide>) => {
    if (readOnly) return;
    updateSlideDirect(projectId, slide.id, updates);
  };

  return (
    <div className="slide-editor">
      <div
        className="slide-canvas"
        style={{ backgroundColor: slide.backgroundColor }}
      >
        {renderSlideContent()}
      </div>


      <div className="slide-sidebar-right" style={{ width: '280px', background: 'white', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {!readOnly && (
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'settings' ? 'white' : '#f5f5f5',
                border: 'none',
                borderBottom: activeTab === 'settings' ? '2px solid #667eea' : 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontWeight: activeTab === 'settings' ? 600 : 400
              }}
            >
              <Settings size={16} /> 設定
            </button>
          )}
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'chat' ? 'white' : '#f5f5f5',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid #667eea' : 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontWeight: activeTab === 'chat' ? 600 : 400
            }}
          >
            <MessageSquare size={16} /> チャット
          </button>
        </div>

        {activeTab === 'settings' && !readOnly && (
          <div className="slide-properties" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
            <h3>スライド設定</h3>
            <div className="property-group">
              <label>背景色</label>
              <input
                type="color"
                value={slide.backgroundColor}
                onChange={(e) => handleColorUpdate({ backgroundColor: e.target.value })}
              />
            </div>
            <div className="property-group">
              <label>文字色</label>
              <input
                type="color"
                value={slide.textColor}
                onChange={(e) => handleColorUpdate({ textColor: e.target.value })}
              />
            </div>
            <div className="property-group">
              <label>テンプレート</label>
              <select
                value={slide.template}
                onChange={(e) =>
                  handleColorUpdate({ template: e.target.value as Slide["template"] })
                }
              >
                <option value="blank">空白</option>
                <option value="title">タイトル</option>
                <option value="title-content">タイトルと内容</option>
                <option value="two-column">2カラム</option>
                <option value="image-text">画像とテキスト</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="messages-list" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                  メッセージはまだありません
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender === username;
                  return (
                    <div key={msg.id || idx} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      marginBottom: '4px'
                    }}>
                      {!isMe && <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px', marginLeft: '4px' }}>{msg.sender}</div>}
                      <div style={{
                        padding: '8px 12px',
                        background: isMe ? '#667eea' : '#e0e0e0',
                        color: isMe ? 'white' : '#333',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#999', textAlign: isMe ? 'right' : 'left', marginTop: '2px', marginRight: '4px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area" style={{ padding: '10px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  width: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
