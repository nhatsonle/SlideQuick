// server/database.cjs
// Use better-sqlite3 from parent node_modules
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

// データベースファイルのパス
const dbPath = path.join(__dirname, "slidequick.db");
const db = new Database(dbPath);

// ユーザーのパスワードハッシュ作成
function hashPassword(password, salt) {
  // scryptSync -> 64 bytes derived key
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.toString("hex");
}

function initializeDatabase() {
  // create projects table (owner_id included)
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      owner_id TEXT NOT NULL
    )
  `);

  // If projects table existed before without owner_id, add column
  const cols = db.prepare("PRAGMA table_info('projects')").all();
  const hasOwner = cols.some((c) => c.name === "owner_id");
  if (!hasOwner) {
    // add column (SQLite doesn't support IF NOT EXISTS for ADD COLUMN)
    db.exec("ALTER TABLE projects ADD COLUMN owner_id TEXT");
  }

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
      image_url TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Check if slides table has image_url (migration for existing dbs)
  const slideCols = db.prepare("PRAGMA table_info('slides')").all();
  const hasImageUrl = slideCols.some((c) => c.name === "image_url");
  if (!hasImageUrl) {
    db.exec("ALTER TABLE slides ADD COLUMN image_url TEXT");
  }

  // ユーザーテーブルを作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  console.log("✅ データベースが初期化されました");
}

// プロジェクトの取得（スライド含む） -- filter by ownerId
function getAllProjects(ownerId) {
  const projects = db
    .prepare(`
      SELECT p.*, u.username as owner_name 
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? 
      ORDER BY p.updated_at DESC
    `)
    .all(ownerId || "");

  return projects.map((project) => {
    const slides = db
      .prepare("SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order")
      .all(project.id);
    return {
      id: project.id,
      name: project.name,
      ownerName: project.owner_name,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      slides: slides.map((slide) => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
        template: slide.template,
        backgroundColor: slide.background_color,
        textColor: slide.text_color,
        imageUrl: slide.image_url
      })),
    };
  });
}

// プロジェクトをIDで取得 -- only if owner matches
function getProjectById(id, ownerId) {
  const project = db
    .prepare(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND p.owner_id = ?
    `)
    .get(id, ownerId);

  if (!project) return null;
  const slides = db
    .prepare("SELECT * FROM slides WHERE project_id = ? ORDER BY slide_order")
    .all(id);
  return {
    id: project.id,
    name: project.name,
    ownerName: project.owner_name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    slides: slides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      content: slide.content,
      template: slide.template,
      backgroundColor: slide.background_color,
      textColor: slide.text_color,
      imageUrl: slide.image_url
    })),
  };
}

// プロジェクトを作成 (expects ownerId)
function createProject(project, ownerId) {
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, created_at, updated_at, owner_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertProject.run(
      project.id,
      project.name,
      project.createdAt,
      project.updatedAt,
      ownerId
    );

    project.slides.forEach((slide, index) => {
      insertSlide.run(
        slide.id,
        project.id,
        slide.title,
        slide.content,
        slide.template,
        slide.backgroundColor,
        slide.textColor,
        index,
        slide.imageUrl || null
      );
    });
  });

  transaction();
  return getProjectById(project.id, ownerId);
}

// プロジェクトを更新 (only if owner matches)
function updateProject(project, ownerId) {
  const updateProjectStmt = db.prepare(`
    UPDATE projects 
    SET name = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?
  `);

  const deleteSlides = db.prepare("DELETE FROM slides WHERE project_id = ?");

  const insertSlide = db.prepare(`
    INSERT INTO slides (id, project_id, title, content, template, background_color, text_color, slide_order, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const info = updateProjectStmt.run(
      project.name,
      project.updatedAt,
      project.id,
      ownerId
    );
    if (info.changes === 0) {
      // project not found or not owned by user
      throw new Error("not_found_or_not_owner");
    }
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
        index,
        slide.imageUrl || null
      );
    });
  });

  try {
    transaction();
  } catch (err) {
    if (err.message === "not_found_or_not_owner") return null;
    throw err;
  }

  return getProjectById(project.id, ownerId);
}

// プロジェクトを削除 (only if owner matches). return true if deleted.
function deleteProject(id, ownerId) {
  const deleteSlides = db.prepare("DELETE FROM slides WHERE project_id = ?");
  const deleteProjectStmt = db.prepare(
    "DELETE FROM projects WHERE id = ? AND owner_id = ?"
  );

  const transaction = db.transaction(() => {
    deleteSlides.run(id);
    const info = deleteProjectStmt.run(id, ownerId);
    return info.changes;
  });

  const changes = transaction();
  return !!changes;
}

/* -----------------------
   ユーザー関連の関数
   ----------------------- */

function getUserByUsername(username) {
  const user = db
    .prepare(
      "SELECT id, username, email, password_hash, salt, created_at FROM users WHERE username = ?"
    )
    .get(username);
  return user || null;
}

function getUserById(id) {
  const user = db
    .prepare("SELECT id, username, email, created_at FROM users WHERE id = ?")
    .get(id);
  return user || null;
}

function createUser(user) {
  const insert = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    user.id,
    user.username,
    user.email || null,
    user.password_hash,
    user.salt,
    user.created_at
  );
  return getUserById(user.id);
}

function verifyUser(username, password) {
  const row = db
    .prepare(
      "SELECT id, username, email, password_hash, salt, created_at FROM users WHERE username = ?"
    )
    .get(username);
  if (!row) return null;

  const derived = hashPassword(password, row.salt);
  const valid = crypto.timingSafeEqual(
    Buffer.from(derived, "hex"),
    Buffer.from(row.password_hash, "hex")
  );
  if (!valid) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  };
}

module.exports = {
  initializeDatabase,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  // users
  getUserByUsername,
  getUserById,
  createUser,
  verifyUser,
  // helper for password hashing to use in server if needed
  _hashPassword: hashPassword,
};
