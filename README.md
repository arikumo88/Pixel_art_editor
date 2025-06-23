# Pixel Art Editor

ピクセルアートを作成・編集するためのWebアプリケーションです。

## 技術スタック

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## 開発環境のセットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

## Python 連携

バックエンド処理を Python スクリプトで実行する簡単な API を追加しました。`app/api/python` に POST すると、`python/hello.py` が呼び出され JSON を返します。

## CSV データ

`data` ディレクトリに CSV ファイルを置くと、`/api/csv/{ファイル名}` で内容を JSON
として取得できます。サンプルとして `data/sample.csv` を同梱しています。

## ライセンス

MIT 