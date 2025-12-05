import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Slide } from '../types';
import '../styles/SlideEditor.css';

interface SlideEditorProps {
  slide: Slide;
  projectId: string;
}

export default function SlideEditor({ slide, projectId }: SlideEditorProps) {
  const { updateSlide } = useApp();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

  const handleUpdate = (updates: Partial<Slide>) => {
    updateSlide(projectId, slide.id, updates);
  };

  const renderSlideContent = () => {
    switch (slide.template) {
      case 'title':
        return (
          <div className="slide-template-title">
            {isEditingTitle ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="slide-input-large"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h1 onClick={() => setIsEditingTitle(true)} style={{ color: slide.textColor }}>
                {slide.title}
              </h1>
            )}
          </div>
        );

      case 'title-content':
        return (
          <div className="slide-template-title-content">
            {isEditingTitle ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="slide-input"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h2 onClick={() => setIsEditingTitle(true)} style={{ color: slide.textColor }}>
                {slide.title}
              </h2>
            )}
            {isEditingContent ? (
              <textarea
                value={slide.content}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                onBlur={() => setIsEditingContent(false)}
                autoFocus
                className="slide-textarea"
                style={{ color: slide.textColor }}
              />
            ) : (
              <div onClick={() => setIsEditingContent(true)} className="slide-content" style={{ color: slide.textColor }}>
                {slide.content}
              </div>
            )}
          </div>
        );

      case 'two-column':
        return (
          <div className="slide-template-two-column">
            {isEditingTitle ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="slide-input"
                style={{ color: slide.textColor }}
              />
            ) : (
              <h2 onClick={() => setIsEditingTitle(true)} style={{ color: slide.textColor }}>
                {slide.title}
              </h2>
            )}
            <div className="two-columns">
              {isEditingContent ? (
                <textarea
                  value={slide.content}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  onBlur={() => setIsEditingContent(false)}
                  autoFocus
                  className="slide-textarea"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <div onClick={() => setIsEditingContent(true)} className="slide-content" style={{ color: slide.textColor }}>
                  {slide.content}
                </div>
              )}
            </div>
          </div>
        );

      case 'image-text':
        return (
          <div className="slide-template-image-text">
            <div className="image-placeholder" style={{ borderColor: slide.textColor }}>
              <span style={{ color: slide.textColor }}>📷 画像</span>
            </div>
            <div className="text-section">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  className="slide-input"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <h2 onClick={() => setIsEditingTitle(true)} style={{ color: slide.textColor }}>
                  {slide.title}
                </h2>
              )}
              {isEditingContent ? (
                <textarea
                  value={slide.content}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  onBlur={() => setIsEditingContent(false)}
                  autoFocus
                  className="slide-textarea"
                  style={{ color: slide.textColor }}
                />
              ) : (
                <div onClick={() => setIsEditingContent(true)} className="slide-content" style={{ color: slide.textColor }}>
                  {slide.content}
                </div>
              )}
            </div>
          </div>
        );

      case 'blank':
      default:
        return (
          <div className="slide-template-blank">
            {isEditingContent ? (
              <textarea
                value={slide.content}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                onBlur={() => setIsEditingContent(false)}
                autoFocus
                className="slide-textarea-full"
                style={{ color: slide.textColor }}
              />
            ) : (
              <div onClick={() => setIsEditingContent(true)} className="slide-content-full" style={{ color: slide.textColor }}>
                {slide.content || 'クリックして編集'}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="slide-editor">
      <div className="slide-canvas" style={{ backgroundColor: slide.backgroundColor }}>
        {renderSlideContent()}
      </div>
      <div className="slide-properties">
        <h3>スライド設定</h3>
        <div className="property-group">
          <label>背景色</label>
          <input
            type="color"
            value={slide.backgroundColor}
            onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
          />
        </div>
        <div className="property-group">
          <label>文字色</label>
          <input
            type="color"
            value={slide.textColor}
            onChange={(e) => handleUpdate({ textColor: e.target.value })}
          />
        </div>
        <div className="property-group">
          <label>テンプレート</label>
          <select
            value={slide.template}
            onChange={(e) => handleUpdate({ template: e.target.value as Slide['template'] })}
          >
            <option value="blank">空白</option>
            <option value="title">タイトル</option>
            <option value="title-content">タイトルと内容</option>
            <option value="two-column">2カラム</option>
            <option value="image-text">画像とテキスト</option>
          </select>
        </div>
      </div>
    </div>
  );
}

