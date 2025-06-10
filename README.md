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

## ライセンス

MIT 