// Use dependencies from parent node_modules
const express = require('../node_modules/express');
const cors = require('../node_modules/cors');
const bodyParser = require('../node_modules/body-parser');
const {
  initializeDatabase,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('./database');

const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());

// データベースを初期化
initializeDatabase();

// ルート
app.get('/', (req, res) => {
  res.json({ message: 'SlideQuick API サーバーが動作中です 🚀' });
});

// すべてのプロジェクトを取得
app.get('/api/projects', (req, res) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    res.status(500).json({ error: 'プロジェクトの取得に失敗しました' });
  }
});

// 特定のプロジェクトを取得
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    res.json(project);
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    res.status(500).json({ error: 'プロジェクトの取得に失敗しました' });
  }
});

// プロジェクトを作成
app.post('/api/projects', (req, res) => {
  try {
    const project = createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    res.status(500).json({ error: 'プロジェクトの作成に失敗しました' });
  }
});

// プロジェクトを更新
app.put('/api/projects/:id', (req, res) => {
  try {
    const project = updateProject(req.body);
    res.json(project);
  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    res.status(500).json({ error: 'プロジェクトの更新に失敗しました' });
  }
});

// プロジェクトを削除
app.delete('/api/projects/:id', (req, res) => {
  try {
    deleteProject(req.params.id);
    res.json({ message: 'プロジェクトが削除されました' });
  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    res.status(500).json({ error: 'プロジェクトの削除に失敗しました' });
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`\n🚀 SlideQuick APIサーバーが起動しました`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 API エンドポイント: http://localhost:${PORT}/api/projects\n`);
});

