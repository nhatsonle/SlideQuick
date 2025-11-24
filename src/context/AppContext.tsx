import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Slide } from '../types';

const API_URL = 'http://localhost:3001/api';

interface AppContextType {
  projects: Project[];
  currentProject: Project | null;
  currentSlideIndex: number;
  loading: boolean;
  createProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (project: Project) => Promise<void>;
  addSlide: (projectId: string, template: Slide['template']) => Promise<void>;
  updateSlide: (projectId: string, slideId: string, updates: Partial<Slide>) => Promise<void>;
  deleteSlide: (projectId: string, slideId: string) => Promise<void>;
  setCurrentSlideIndex: (index: number) => void;
  refreshProjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // プロジェクトをAPIから読み込む
  const refreshProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) throw new Error('プロジェクトの取得に失敗しました');
      
      const data = await response.json();
      const parsedProjects = data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
      
      setProjects(parsedProjects);
    } catch (error) {
      console.error('プロジェクトの読み込みエラー:', error);
      alert('プロジェクトの読み込みに失敗しました。サーバーが起動しているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    refreshProjects();
  }, []);

  // 現在のプロジェクトを更新
  useEffect(() => {
    if (currentProject) {
      const updated = projects.find(p => p.id === currentProject.id);
      if (updated) {
        setCurrentProject(updated);
      }
    }
  }, [projects]);

  const createProject = async (name: string) => {
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        slides: [
          {
            id: crypto.randomUUID(),
            title: 'ようこそ',
            content: 'クリックしてスライドを編集',
            template: 'title',
            backgroundColor: '#ffffff',
            textColor: '#000000',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) throw new Error('プロジェクトの作成に失敗しました');

      await refreshProjects();
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      alert('プロジェクトの作成に失敗しました');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('プロジェクトの削除に失敗しました');

      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      
      await refreshProjects();
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      alert('プロジェクトの削除に失敗しました');
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const updatedProject = { ...project, updatedAt: new Date() };
      
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) throw new Error('プロジェクトの更新に失敗しました');

      await refreshProjects();
    } catch (error) {
      console.error('プロジェクト更新エラー:', error);
      alert('プロジェクトの更新に失敗しました');
    }
  };

  const addSlide = async (projectId: string, template: Slide['template']) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: '新しいスライド',
      content: 'クリックして編集',
      template,
      backgroundColor: '#ffffff',
      textColor: '#000000',
    };

    const updatedProject = {
      ...project,
      slides: [...project.slides, newSlide],
      updatedAt: new Date(),
    };
    
    await updateProject(updatedProject);
  };

  const updateSlide = async (projectId: string, slideId: string, updates: Partial<Slide>) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedProject = {
      ...project,
      slides: project.slides.map(s => s.id === slideId ? { ...s, ...updates } : s),
      updatedAt: new Date(),
    };
    
    await updateProject(updatedProject);
  };

  const deleteSlide = async (projectId: string, slideId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || project.slides.length <= 1) return;

    const updatedProject = {
      ...project,
      slides: project.slides.filter(s => s.id !== slideId),
      updatedAt: new Date(),
    };
    
    await updateProject(updatedProject);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        currentProject,
        currentSlideIndex,
        loading,
        createProject,
        deleteProject,
        setCurrentProject,
        updateProject,
        addSlide,
        updateSlide,
        deleteSlide,
        setCurrentSlideIndex,
        refreshProjects,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
