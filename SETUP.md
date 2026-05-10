# TORU — 環境変数セットアップ手順

## ステップ1: Supabase APIキーを取得

1. Supabase Dashboard にログイン → `toru-dev` プロジェクトを選択
2. 左メニュー **Settings** → **API** を開く
3. 以下の2つをコピー:
   - **Project API keys → anon public** （`eyJ...` で始まる長い文字列）
   - **Project API keys → service_role** （同じく `eyJ...` で始まる）

## ステップ2: .env.local に貼り付け

`E:/AI project/TORU/.env.local` を開いて、以下の箇所を書き換える:

```
SUPABASE_ANON_KEY=ここに anon public key を貼り付け
  ↓
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...（コピーしたキー）

SUPABASE_SERVICE_ROLE_KEY=ここに service_role key を貼り付け
  ↓
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...（コピーしたキー）
```

**注意:**
- anon key は合計3箇所（`SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`）あるので、全部同じ値を貼り付ける
- URL は既に埋めてあるので触らなくてOK
- Claude API・Stripe は v0.2 以降に使うので、今は空のままでOK

## ステップ3: 完了報告

貼り付けが終わったら「貼った」と教えてください。
秘書側でマイグレーションSQL準備に進みます。

---

## セキュリティ注意事項

- `.env.local` は `.gitignore` で除外済み → Gitにコミットされない
- `service_role key` は外部に絶対に出さない（このチャットに貼り直しも不要）
- もしキーが漏れた疑いがある場合は Supabase Dashboard で即 **Regenerate** する
