// Use better-sqlite3 from parent node_modules
const Database = require('../node_modules/better-sqlite3');
const path = require('path');

// データベースファイルのパス
const dbPath = path.join(__dirname, 'slidequick.db');
const db = new Database(dbPath);

// テーブルを初期化
function initializeDatabase() {
  // プロジェクトテーブルを作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // スライドテーブルを作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      template TEXT NOT NULL,
      background_color TEXT NOT NULL,
      text_color TEXT NOT NULL,
      slide_order INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ データベースが初期化されました');
}

// プロジェクトの取得（スライド含む）
function getAllProjects() {
  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  
  return projects.map(project => {
    const slides = db.prepare('SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order').all(project.id);
    
    return {
      id: project.id,
      name: project.name,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      slides: slides.map(slide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
        template: slide.template,
        backgroundColor: slide.background_color,
        textColor: slide.text_color,
      }))
    };
  });
}

// プロジェクトをIDで取得
function getProjectById(id) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  
  if (!project) return null;
  
  const slides = db.prepare('SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order').all(id);
  
  return {
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    slides: slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      content: slide.content,
      template: slide.template,
      backgroundColor: slide.background_color,
      textColor: slide.text_color,
    }))
  };
}

// プロジェクトを作成
function createProject(project) {
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    insertProject.run(project.id, project.name, project.createdAt, project.updatedAt);
    
    project.slides.forEach((slide, index) => {
      insertSlide.run(
        slide.id,
        project.id,
        slide.title,
        slide.content,
        slide.template,
        slide.backgroundColor,
        slide.textColor,
        index
      );
    });
  });
  
  transaction();
  return getProjectById(project.id);
}

// プロジェクトを更新
function updateProject(project) {
  const updateProjectStmt = db.prepare(`
    UPDATE projects 
    SET name = ?, updated_at = ?
    WHERE id = ?
  `);
  
  const deleteSlides = db.prepare('DELETE FROM slides WHERE project_id = ?');
  
  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    updateProjectStmt.run(project.name, project.updatedAt, project.id);
    deleteSlides.run(project.id);
    
    project.slides.forEach((slide, index) => {
      insertSlide.run(
        slide.id,
        project.id,
        slide.title,
        slide.content,
        slide.template,
        slide.backgroundColor,
        slide.textColor,
        index
      );
    });
  });
  
  transaction();
  return getProjectById(project.id);
}

// プロジェクトを削除
function deleteProject(id) {
  const deleteSlides = db.prepare('DELETE FROM slides WHERE project_id = ?');
  const deleteProjectStmt = db.prepare('DELETE FROM projects WHERE id = ?');
  
  const transaction = db.transaction(() => {
    deleteSlides.run(id);
    deleteProjectStmt.run(id);
  });
  
  transaction();
}

module.exports = {
  initializeDatabase,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};

