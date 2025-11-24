# SlideQuick サーバーセットアップガイド

このガイドでは、SlideQuickのバックエンドサーバーのセットアップと使用方法について説明します。

## 概要

SlideQuickは以下の技術スタックを使用しています:
- **Express.js**: RESTful APIサーバー
- **SQLite**: 軽量なデータベース（better-sqlite3）
- **CORS**: クロスオリジンリソース共有の有効化

## セットアップ手順

### 1. サーバー依存関係のインストール

```bash
cd server
npm install
```

インストールされるパッケージ:
- `express`: Webフレームワーク
- `better-sqlite3`: SQLiteデータベースドライバ
- `cors`: CORS対応
- `body-parser`: JSONリクエストボディのパース
- `nodemon`: 開発用の自動再起動ツール

### 2. サーバーの起動

**開発モード（自動再起動）:**
```bash
npm run dev
```

**本番モード:**
```bash
npm start
```

または、プロジェクトルートから:
```bash
npm run server
```

### 3. サーバーの動作確認

サーバーが起動すると、以下のメッセージが表示されます:

```
✅ データベースが初期化されました

🚀 SlideQuick APIサーバーが起動しました
📍 URL: http://localhost:3001
📊 API エンドポイント: http://localhost:3001/api/projects
```

ブラウザまたはcURLで確認:
```bash
curl http://localhost:3001
# 出力: {"message":"SlideQuick API サーバーが動作中です 🚀"}
```

## データベース

### 自動初期化

サーバーの初回起動時に、SQLiteデータベース（`slidequick.db`）が自動的に作成されます。

### テーブル構造

**projects テーブル:**
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

**slides テーブル:**
```sql
CREATE TABLE slides (
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
```

### データベースの場所

データベースファイル: `server/slidequick.db`

このファイルは自動的に作成され、すべてのプロジェクトとスライドデータが保存されます。

## API エンドポイント

### 基本URL
```
http://localhost:3001/api
```

### エンドポイント一覧

#### 1. すべてのプロジェクトを取得
```
GET /api/projects
```

**レスポンス:**
```json
[
  {
    "id": "uuid",
    "name": "プロジェクト名",
    "createdAt": "2025-11-24T10:00:00.000Z",
    "updatedAt": "2025-11-24T10:00:00.000Z",
    "slides": [...]
  }
]
```

#### 2. 特定のプロジェクトを取得
```
GET /api/projects/:id
```

#### 3. プロジェクトを作成
```
POST /api/projects
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "id": "uuid",
  "name": "新しいプロジェクト",
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T10:00:00.000Z",
  "slides": [
    {
      "id": "uuid",
      "title": "タイトル",
      "content": "内容",
      "template": "title",
      "backgroundColor": "#ffffff",
      "textColor": "#000000"
    }
  ]
}
```

#### 4. プロジェクトを更新
```
PUT /api/projects/:id
Content-Type: application/json
```

**リクエストボディ:** 作成時と同じ形式

#### 5. プロジェクトを削除
```
DELETE /api/projects/:id
```

## フロントエンドとの接続

フロントエンドは`src/context/AppContext.tsx`でAPIに接続しています:

```typescript
const API_URL = 'http://localhost:3001/api';
```

本番環境では、この値を環境変数で設定することをお勧めします。

## トラブルシューティング

### ポートが既に使用されている

エラー: `EADDRINUSE: address already in use :::3001`

**解決方法:**
1. 別のプロセスがポート3001を使用している場合:
   ```bash
   # Windowsの場合
   netstat -ano | findstr :3001
   taskkill /PID <プロセスID> /F
   
   # macOS/Linuxの場合
   lsof -i :3001
   kill -9 <プロセスID>
   ```

2. または、`server/server.js`のPORT番号を変更:
   ```javascript
   const PORT = 3002; // 別のポートに変更
   ```

### データベースエラー

エラー: `Database error: ...`

**解決方法:**
1. データベースファイルを削除して再作成:
   ```bash
   cd server
   rm slidequick.db
   npm start
   ```

2. 権限の確認:
   ```bash
   # server/ディレクトリに書き込み権限があるか確認
   ls -la server/
   ```

### CORSエラー

エラー: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決方法:**
サーバーのCORS設定を確認（`server/server.js`）:
```javascript
app.use(cors()); // すべてのオリジンを許可
```

## 本番環境へのデプロイ

### 1. 環境変数の設定

`.env`ファイルを作成:
```env
PORT=3001
NODE_ENV=production
DATABASE_PATH=./slidequick.db
```

### 2. サーバーの起動

```bash
cd server
NODE_ENV=production npm start
```

### 3. プロセスマネージャーの使用（推奨）

**PM2を使用:**
```bash
npm install -g pm2
pm2 start server/server.js --name slidequick-api
pm2 save
pm2 startup
```

### 4. データベースのバックアップ

定期的にデータベースをバックアップ:
```bash
cp server/slidequick.db server/backups/slidequick-$(date +%Y%m%d).db
```

## 開発のヒント

### ログの確認
```bash
# サーバーのログをリアルタイムで確認
npm run dev
```

### データベースの内容を確認
```bash
# SQLiteコマンドラインツールを使用
sqlite3 server/slidequick.db
sqlite> SELECT * FROM projects;
sqlite> .quit
```

### APIのテスト
```bash
# curlを使用
curl http://localhost:3001/api/projects

# または、Postman/Insomniaなどのツールを使用
```

## セキュリティ考慮事項

本番環境では以下を実装することをお勧めします:

1. **認証と認可**: JWT トークンなど
2. **レート制限**: APIの過剰使用を防ぐ
3. **入力検証**: リクエストデータの検証
4. **HTTPS**: SSL/TLS証明書の使用
5. **環境変数**: 機密情報の保護

## サポート

問題が発生した場合は、以下を確認してください:
- Node.jsのバージョン（v18以上）
- 依存関係が正しくインストールされているか
- ポートが利用可能か
- データベースファイルの権限

---

**Happy Coding! 🚀**

