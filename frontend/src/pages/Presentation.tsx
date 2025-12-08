import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSessionOnce } from '../services/collab';
import '../styles/Presentation.css';

export default function Presentation() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const proj = projects.find(p => p.id === projectId);
    const share = searchParams.get('share');

    if (proj) {
      setProject(proj);
    } else if (share) {
      // Try to fetch shared session
      getSessionOnce(share).then((snap) => {
        if (snap && snap.project) {
          setProject(snap.project);
        } else {
          // Not found
          console.warn('Shared presentation not found');
          navigate('/');
        }
      });
    } else {
      // Not found locally and no share link
      navigate('/');
    }
  }, [projectId, projects, searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        exitPresentation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, project]);

  if (!project) {
    return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem' }}>読み込み中...</div>;
  }

  const currentSlide = project.slides[currentIndex];

  const nextSlide = () => {
    if (currentIndex < project.slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const exitPresentation = () => {
    const share = searchParams.get('share');
    if (share) {
      navigate(`/editor/${projectId}?share=${share}`);
    } else {
      navigate(`/editor/${projectId}`);
    }
  };

  const renderSlideContent = () => {
    switch (currentSlide.template) {
      case 'title':
        return (
          <div className="present-template-title">
            <h1 style={{ color: currentSlide.textColor }}>{currentSlide.title}</h1>
          </div>
        );

      case 'title-content':
        return (
          <div className="present-template-title-content">
            <h2 style={{ color: currentSlide.textColor }}>{currentSlide.title}</h2>
            <div className="present-content" style={{ color: currentSlide.textColor }}>
              {currentSlide.content}
            </div>
          </div>
        );

      case 'two-column':
        return (
          <div className="present-template-two-column">
            <h2 style={{ color: currentSlide.textColor }}>{currentSlide.title}</h2>
            <div className="present-columns">
              <div className="present-content" style={{ color: currentSlide.textColor }}>
                {currentSlide.content}
              </div>
            </div>
          </div>
        );

      case 'image-text':
        return (
          <div className="present-template-image-text">
            <div className="present-image-placeholder" style={{ borderColor: currentSlide.textColor }}>
              <span style={{ color: currentSlide.textColor }}>📷</span>
            </div>
            <div className="present-text-section">
              <h2 style={{ color: currentSlide.textColor }}>{currentSlide.title}</h2>
              <div className="present-content" style={{ color: currentSlide.textColor }}>
                {currentSlide.content}
              </div>
            </div>
          </div>
        );

      case 'blank':
      default:
        return (
          <div className="present-template-blank">
            <div className="present-content-full" style={{ color: currentSlide.textColor }}>
              {currentSlide.content}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="presentation">
      <button className="presentation-exit" onClick={exitPresentation}>
        <X size={24} />
      </button>

      <div className="presentation-slide" style={{ backgroundColor: currentSlide.backgroundColor }}>
        {renderSlideContent()}
      </div>

      <div className="presentation-controls">
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="control-btn"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="slide-counter">
          {currentIndex + 1} / {project.slides.length}
        </span>
        <button
          onClick={nextSlide}
          disabled={currentIndex === project.slides.length - 1}
          className="control-btn"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

