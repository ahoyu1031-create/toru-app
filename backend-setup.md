# TORU — バックエンドセットアップ手順

Supabase プロジェクトの初期化からマイグレーション適用・疎通確認までの手順。

作成: 2026-04-21

---

## 前提

- Supabase プロジェクト `toru-dev` 作成済み
- URL: `https://haydjnybdqwuzibljdqk.supabase.co`
- `.env.local` に以下が設定済み:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## マイグレーション適用の選択肢

### 方法A: Supabase Dashboard の SQL Editor で直接実行（最速）

初期構築は Dashboard から直接流すのが最も簡単。

1. Supabase Dashboard → 左メニュー **SQL Editor** を開く
2. 以下の順で各ファイルの中身を貼り付けて実行（緑の「Run」ボタン）:
   1. `supabase/migrations/20260421000001_init_schema.sql`
   2. `supabase/migrations/20260421000002_init_users_companies.sql`
   3. `supabase/migrations/20260421000003_init_unit_price.sql`
   4. `supabase/migrations/20260421000004_init_quotes.sql`
   5. `supabase/migrations/20260421000005_rls_policies.sql`
3. 最後にシードデータ:
   6. `supabase/seed.sql`
4. 実行後、**Table Editor** を開いて全8テーブル（users / companies / company_member / subscriptions / public_unit_price_master / unit_price_master / quotes / quote_items）が作成されていることを確認

### 方法B: Supabase CLI で管理（推奨・継続運用向け）

本格的に運用するなら CLI で履歴管理する。

#### 初回セットアップ

```bash
# 1. Supabase CLI インストール（scoop / brew / npm など）
# Windows (Scoop の場合):
scoop install supabase

# または npx で都度実行:
npx supabase --version

# 2. プロジェクトディレクトリでログイン
cd "E:/AI project/TORU"
npx supabase login

# 3. プロジェクトを初期化
npx supabase init

# 4. リモートプロジェクトにリンク
# プロジェクト参照IDは Dashboard URL の `/project/<id>/` 部分
npx supabase link --project-ref haydjnybdqwuzibljdqk
```

#### マイグレーション適用

```bash
# リモートDBに現在の migrations/ を適用
npx supabase db push

# シードデータ投入（Dashboard SQL Editor で seed.sql を貼る方が早いが、CLIでも可）
```

---

## 疎通確認（Node.js スクリプト）

### 必要パッケージ

```bash
cd "E:/AI project/TORU"
npm init -y  # まだ package.json がなければ
npm install @supabase/supabase-js dotenv
```

### 実行

```bash
node scripts/test-connection.mjs
```

### 期待される出力

```
[OK] 環境変数ロード成功
     URL: https://haydjnybdqwuzibljdqk.supabase.co

[Test 1] service_role で public_unit_price_master を読む
  [OK] 8件 取得
  （塩ビ管・エルボ・バルブ類が表示される）

[Test 2] 未認証 anon で unit_price_master を読む（RLS検証）
  [OK] 空配列（RLSで0件に絞られた）

[Test 3] 未認証 anon で public_unit_price_master を読む
  [OK] 空配列（未認証では0件、認証後に読める設計）

[完了] 基本的な疎通・RLS動作確認 OK
```

---

## トラブルシューティング

### "permission denied for table xxx"
→ RLS ポリシーが未作成 or 適用対象が違う。マイグレーション ⑤ の適用を確認。

### "auth.users is not accessible"
→ Dashboard で実行する場合は問題なし。ローカルCLIの場合、`service_role` で接続している確認。

### "extension pgcrypto does not exist"
→ Dashboard の Database → Extensions で `pgcrypto` を手動有効化。

### anon key で操作したいのにRLSで全部弾かれる
→ これは**正しい動作**。ログイン後は JWT トークンが発行されて `auth.uid()` が取れる。

---

## 完了したら

- [ ] 方法A または B でマイグレーション5本を適用
- [ ] seed.sql を流す
- [ ] `node scripts/test-connection.mjs` が OK を返す
- [ ] Table Editor で全8テーブル確認

完了したら秘書に「疎通OK」と報告してください。
次のステップ（Web版プロジェクト初期化）に進みます。
