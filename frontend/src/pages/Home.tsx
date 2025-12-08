import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Edit, Presentation } from 'lucide-react';
import '../styles/Home.css';

export default function Home() {
  const { projects, createProject, deleteProject, setCurrentProject, loading, logout } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateProject = async () => {
    if (projectName.trim()) {
      await createProject(projectName.trim());
      setProjectName('');
      setShowModal(false);
    }
  };

  const handleOpenProject = (project: any) => {
    setCurrentProject(project);
    navigate(`/editor/${project.id}`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('このプロジェクトを削除してもよろしいですか？')) {
      await deleteProject(id);
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">
            <Presentation size={32} />
            SlideQuick
          </h1>
          <p className="tagline">美しいプレゼンテーションを数分で作成</p>
          <div style={{ position: 'absolute', right: 20, top: 18 }}>
            <button className="btn-secondary" onClick={handleLogout}>ログアウト</button>
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="container">
          <div className="projects-header">
            <h2>プロジェクト一覧</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              新規プロジェクト
            </button>
          </div>

          <div className="projects-grid">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>読み込み中...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <Presentation size={64} />
                <h3>プロジェクトがまだありません</h3>
                <p>最初のプロジェクトを作成しましょう</p>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={20} />
                  プロジェクトを作成
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className="project-card"

                >
                  <div className="project-preview" onClick={() => handleOpenProject(project)}>
                    <div className="slide-count">{project.slides.length} スライド</div>
                  </div>
                  <div className="project-info" onClick={() => handleOpenProject(project)}>
                    <h3>{project.name}</h3>
                    {project.ownerName && (
                      <p className="project-owner">
                        作成者: {project.ownerName}
                      </p>
                    )}
                    <p className="project-date">
                      更新日: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="project-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProject(project);
                      }}
                      title="編集"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteProject(e, project.id);
                      }}
                      title="削除"
                    >
                      <Trash2 size={18} style={{ pointerEvents: 'none' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>新規プロジェクトを作成</h2>
            <input
              type="text"
              placeholder="プロジェクト名を入力"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleCreateProject}>
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

