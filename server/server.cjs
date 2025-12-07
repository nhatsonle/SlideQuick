// server/server.cjs (sửa để thêm auth endpoints)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  initializeDatabase,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getUserByUsername,
  createUser,
  verifyUser,
} = require("./database.cjs");

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const requireAuth = require("./authMiddleware.cjs");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
// Serve uploads folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// データベースを初期化
initializeDatabase();

// ルート
app.get("/", (req, res) => {
  res.json({ message: "SlideQuick API サーバーが動作中です 🚀" });
});

/* --------- Projects endpoints (既存) ---------- */
// Replace the public GET endpoints with protected ones
// GET /api/projects (protected)
app.get("/api/projects", requireAuth, (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const projects = getAllProjects(userId);
    res.json(projects);
  } catch (error) {
    console.error("プロジェクト取得エラー:", error);
    res.status(500).json({ error: "プロジェクトの取得に失敗しました" });
  }
});

app.get("/api/projects/:id", requireAuth, (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const project = getProjectById(req.params.id, userId);
    if (!project) {
      return res.status(404).json({
        error: "プロジェクトが見つかりません または 権限がありません",
      });
    }
    res.json(project);
  } catch (error) {
    console.error("プロジェクト取得エラー:", error);
    res.status(500).json({ error: "プロジェクトの取得に失敗しました" });
  }
});

// Protect create/update/delete with JWT auth
app.post("/api/projects", requireAuth, (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const project = createProject(req.body, userId);
    res.status(201).json(project);
  } catch (error) {
    console.error("プロジェクト作成エラー:", error);
    res.status(500).json({ error: "プロジェクトの作成に失敗しました" });
  }
});

app.put("/api/projects/:id", requireAuth, (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const project = updateProject(req.body, userId);
    if (!project)
      return res
        .status(404)
        .json({ error: "プロジェクトが見つからないか権限がありません" });
    res.json(project);
  } catch (error) {
    console.error("プロジェクト更新エラー:", error);
    res.status(500).json({ error: "プロジェクトの更新に失敗しました" });
  }
});

app.delete("/api/projects/:id", requireAuth, (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const ok = deleteProject(req.params.id, userId);
    if (!ok)
      return res
        .status(404)
        .json({ error: "プロジェクトが見つからないか権限がありません" });
    res.json({ message: "プロジェクトが削除されました" });
  } catch (error) {
    console.error("プロジェクト削除エラー:", error);
    res.status(500).json({ error: "プロジェクトの削除に失敗しました" });
  }
});

// POST /api/upload
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url });
});

/* --------- Auth endpoints (新規) ---------- */

// POST /api/register
// body: { username, email?, password }
app.post("/api/register", (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username と password は必須です" });
    }

    if (getUserByUsername(username)) {
      return res
        .status(409)
        .json({ error: "そのユーザー名は既に使用されています" });
    }

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = require("./database.cjs")._hashPassword(
      password,
      salt
    );

    const user = createUser({
      id,
      username,
      email: email || null,
      password_hash,
      salt,
      created_at: new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("ユーザー作成エラー:", error);
    res.status(500).json({ error: "ユーザーの作成に失敗しました" });
  }
});

// POST /api/login
// body: { username, password }
app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username と password は必須です" });
    }

    const user = verifyUser(username, password);
    if (!user) return res.status(401).json({ error: "認証に失敗しました" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token + user info
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("ログインエラー:", error);
    res.status(500).json({ error: "ログインに失敗しました" });
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`\n🚀 SlideQuick APIサーバーが起動しました`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 API エンドポイント: http://localhost:${PORT}/api/projects\n`);
});
