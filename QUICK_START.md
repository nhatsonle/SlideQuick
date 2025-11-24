# 🚀 SlideQuick クイックスタートガイド

## データベースへの移行完了！

SlideQuickはブラウザのlocalStorageから**SQLiteデータベース**に移行しました。
すべてのプロジェクトとスライドは永続的に保存されます。

## セットアップ（初回のみ）

### 1. 依存関係のインストール

```bash
cd slidequick
npm install
```

これで、フロントエンドとバックエンドの両方の依存関係がインストールされます。

## アプリケーションの起動

### 方法1: フルスタックを同時起動（推奨）

```bash
npm run dev:full
```

このコマンドで以下が同時に起動します:
- **バックエンドAPI**: http://localhost:3001
- **フロントエンド**: http://localhost:5173

### 方法2: 個別に起動

**ターミナル1 - バックエンド:**
```bash
npm run server
```

**ターミナル2 - フロントエンド:**
```bash
npm run dev
```

## 動作確認

### 1. サーバーの確認

バックエンドが正常に起動すると、以下が表示されます:

```
✅ データベースが初期化されました

🚀 SlideQuick APIサーバーが起動しました
📍 URL: http://localhost:3001
📊 API エンドポイント: http://localhost:3001/api/projects
```

### 2. フロントエンドの確認

ブラウザで以下にアクセス:
```
http://localhost:5173
```

### 3. データベースの確認

`slidequick/server/slidequick.db` ファイルが作成されていることを確認してください。

## データベースについて

### 保存場所
```
slidequick/server/slidequick.db
```

### 自動初期化
サーバーの初回起動時に、データベースが自動的に作成されます。

### データの永続化
- サーバーを再起動してもデータは保持されます
- ブラウザのキャッシュをクリアしてもデータは保持されます
- データベースファイルをバックアップすることで、データを保護できます

## 主な変更点

### ✅ 実装済み
- SQLiteデータベースでのデータ保存
- RESTful API（GET, POST, PUT, DELETE）
- プロジェクトとスライドの完全なCRUD操作
- 自動データベース初期化
- トランザクションによるデータ整合性

### 🔄 従来との違い
- **localStorage** → **SQLiteデータベース**
- ブラウザに保存 → サーバーに保存
- クライアントサイドのみ → クライアント・サーバー構成

## トラブルシューティング

### サーバーが起動しない

**エラー: ポートが既に使用されている**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解決方法:**
```bash
# プロセスを確認
netstat -ano | findstr :3001

# プロセスを終了
taskkill /PID <プロセスID> /F
```

### フロントエンドがAPIに接続できない

**確認事項:**
1. バックエンドサーバーが起動しているか確認
2. `http://localhost:3001/api/projects` にアクセスして空の配列 `[]` が返されるか確認
3. ブラウザのコンソールでエラーを確認

### データが保存されない

**確認事項:**
1. `server/slidequick.db` ファイルが存在するか
2. サーバーのログでエラーがないか確認
3. ブラウザのネットワークタブでAPIリクエストが成功しているか確認

## データベース管理

### バックアップ

```bash
# データベースをバックアップ
copy server\slidequick.db server\slidequick-backup.db
```

### データの確認

SQLiteコマンドラインツールを使用:
```bash
sqlite3 server\slidequick.db
sqlite> SELECT * FROM projects;
sqlite> .quit
```

または、[DB Browser for SQLite](https://sqlitebrowser.org/)を使用して視覚的に確認できます。

### データのリセット

```bash
# データベースファイルを削除（サーバー停止後）
del server\slidequick.db

# サーバーを再起動すると、新しい空のデータベースが作成されます
npm run server
```

## API エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/api/projects` | すべてのプロジェクトを取得 |
| GET | `/api/projects/:id` | 特定のプロジェクトを取得 |
| POST | `/api/projects` | プロジェクトを作成 |
| PUT | `/api/projects/:id` | プロジェクトを更新 |
| DELETE | `/api/projects/:id` | プロジェクトを削除 |

## 次のステップ

1. ✅ データベースが正常に動作していることを確認
2. 🎨 プロジェクトを作成してスライドを編集
3. 💾 サーバーを再起動してデータが保持されることを確認
4. 📦 定期的にデータベースをバックアップ

## その他のドキュメント

- **詳細なセットアップ**: `SERVER_SETUP.md`
- **アプリケーション全体**: `README.md`

---

**Happy Coding! 🚀**

プロジェクトのデータは安全にデータベースに保存されています！

