export interface Slide {
  id: string;
  title: string;
  content: string;
  template: 'blank' | 'title' | 'title-content' | 'two-column' | 'image-text';
  backgroundColor: string;
  textColor: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  ownerName?: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  currentSlideIndex: number;
}

export interface User {
  id: string;
  username: string;
  email?: string | null;
  createdAt: string | Date;
}