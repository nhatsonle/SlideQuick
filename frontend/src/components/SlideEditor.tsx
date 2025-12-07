import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Slide } from "../../types";
import "../styles/SlideEditor.css";

interface SlideEditorProps {
  slide: Slide;
  projectId: string;
}

export default function SlideEditor({ slide, projectId }: SlideEditorProps) {
  const { updateSlide } = useApp();
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
    if (localTitle !== slide.title) {
      updateSlide(projectId, slide.id, { title: localTitle });
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (localContent !== slide.content) {
      updateSlide(projectId, slide.id, { content: localContent });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            {isEditingTitle ? (
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
                onClick={() => setIsEditingTitle(true)}
                style={{ color: slide.textColor }}
              >
                {localTitle}
              </h1>
            )}
          </div>
        );

      case "title-content":
        return (
          <div className="slide-template-title-content">
            {isEditingTitle ? (
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
                onClick={() => setIsEditingTitle(true)}
                style={{ color: slide.textColor }}
              >
                {localTitle}
              </h2>
            )}
            {isEditingContent ? (
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
                onClick={() => setIsEditingContent(true)}
                className="slide-content"
                style={{ color: slide.textColor }}
              >
                {localContent}
              </div>
            )}
          </div>
        );

      case "two-column":
        return (
          <div className="slide-template-two-column">
            {isEditingTitle ? (
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
                onClick={() => setIsEditingTitle(true)}
                style={{ color: slide.textColor }}
              >
                {localTitle}
              </h2>
            )}
            <div className="two-columns">
              {isEditingContent ? (
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
                  onClick={() => setIsEditingContent(true)}
                  className="slide-content"
                  style={{ color: slide.textColor }}
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
              style={{ borderColor: slide.textColor, cursor: "pointer", overflow: "hidden" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="Slide" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: slide.textColor }}>📷 画像を選択</span>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-section">
              {isEditingTitle ? (
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
                  onClick={() => setIsEditingTitle(true)}
                  style={{ color: slide.textColor }}
                >
                  {localTitle}
                </h2>
              )}
              {isEditingContent ? (
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
                  onClick={() => setIsEditingContent(true)}
                  className="slide-content"
                  style={{ color: slide.textColor }}
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
            {isEditingContent ? (
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
                onClick={() => setIsEditingContent(true)}
                className="slide-content-full"
                style={{ color: slide.textColor }}
              >
                {localContent || "クリックして編集"}
              </div>
            )}
          </div>
        );
    }
  };

  const { updateSlide: updateSlideDirect } = useApp();
  const handleColorUpdate = (updates: Partial<Slide>) => {
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
      <div className="slide-properties">
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
    </div>
  );
}
