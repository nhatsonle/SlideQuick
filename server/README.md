# SlideQuick サーバー

## 重要: 依存関係について

このサーバーは親ディレクトリの`node_modules`を使用します。
サーバー専用の`npm install`は不要です。

## 起動方法

プロジェクトルートから:

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev:full

# または、サーバーのみ起動
npm run server
```

## データベース

SQLiteデータベース（`slidequick.db`）は初回起動時に自動作成されます。

## トラブルシューティング

### Windows環境でnative moduleのエラーが出る場合

better-sqlite3は既にプロジェクトルートにインストールされています。
server/内で個別にnpm installを実行する必要はありません。

詳細は `SERVER_SETUP.md` を参照してください。

