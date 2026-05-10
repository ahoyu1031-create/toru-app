# TORU — DB設計（Supabase / PostgreSQL）

## 概要

TORUのデータモデル設計書。
4コアモデル（user / company / unit_price_master / quote）を中心に、
グループ機能・共通マスタ・共有ログ・将来のDM予約までを含む。

設計原則:
- **会社単位の厳密分離**（単価・見積書）— Row Level Security (RLS) で強制
- **金額情報の物理的トレーサビリティ**（共有ログで追跡）
- **共通マスタは read-only、ユーザーがコピーして使う**

作成: 2026-04-19

---

## 設計・方針

### スコープと境界

| データ | 所属 | 共有可否 |
|--------|------|---------|
| 単価マスタ | 会社内クローズド | グループ共有時 🔴 確認必須 |
| 見積書 | 会社内クローズド | グループ共有時 🔴 確認必須 |
| 図面PDF | アップロードしたユーザー/会社 | グループ共有時 🟢 軽い確認 |
| 構造データ（金額抜き） | グループ | 🟡 中確認 |
| 共通マスタ | 全ユーザー read-only | 共有ではなく公開資産 |
| 施工メモ | グループ | 🟢 軽い確認 |

### 命名規則
- テーブル: snake_case 複数形（`users`, `companies`）
- 連関テーブル: `<a>_<b>` 単数形（`company_member`）
- 主キー: `id` (uuid, default gen_random_uuid())
- 監査列: `created_at`, `updated_at` (timestamptz, default now())
- 削除: 論理削除 `deleted_at`（nullable）

### RLS（Row Level Security）方針
- すべてのテーブルでRLS有効
- `company_id` をスコープに使うテーブルは「current_user の所属会社のみ」ポリシー
- グループ共有テーブルは「グループメンバーのみ」ポリシー
- 共通マスタは「全認証ユーザー read-only」

---

## 詳細

### コア4モデル

#### 1. `users` — ユーザー
```sql
id              uuid PK
email           text UNIQUE NOT NULL
display_name    text
plan_type       text CHECK (plan_type IN ('individual', 'company'))
industry_tag    text  -- 業種タグ（配管/電気/ダクト/建築/その他）プロフィール登録
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
```
※ 認証は Supabase Auth を利用、`auth.users` と `users.id` を一致させる

#### 2. `companies` — 会社
```sql
id              uuid PK
name            text NOT NULL
plan            text CHECK (plan IN ('individual', 'team_5', 'team_10', 'team_unlimited'))
industry_tag    text  -- 業種タグ（配管/電気/ダクト/建築/その他）
stripe_customer_id  text
created_by      uuid FK → users.id
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
```

#### 2-2. `company_member` — 会社メンバー連関
```sql
company_id      uuid FK → companies.id
user_id         uuid FK → users.id
role            text CHECK (role IN ('owner', 'admin', 'member'))
joined_at       timestamptz
PRIMARY KEY (company_id, user_id)
```

#### 3. `unit_price_master` — 単価マスタ（会社別）
```sql
id              uuid PK
company_id      uuid FK → companies.id  -- ★ RLSキー
material_name   text NOT NULL
unit            text NOT NULL  -- m / 本 / 個 / セット / 式
unit_price      numeric(12,2) NOT NULL
category        text
memo            text
source_master_id  uuid FK → public_unit_price_master.id  -- 共通マスタからコピー時
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
```

#### 4. `quotes` — 見積書
```sql
id              uuid PK
company_id      uuid FK → companies.id  -- ★ RLSキー
project_name    text
client_name     text
quote_date      date
total_amount    numeric(14,2)
status          text CHECK (status IN ('draft', 'issued', 'accepted', 'rejected'))
pdf_storage_path  text  -- Supabase Storage パス
created_by      uuid FK → users.id
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
```

#### 4-2. `quote_items` — 見積書明細
```sql
id              uuid PK
quote_id        uuid FK → quotes.id
material_name   text NOT NULL
unit            text
quantity        numeric(12,2) NOT NULL
unit_price      numeric(12,2) NOT NULL
subtotal        numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
unit_price_master_id  uuid FK → unit_price_master.id  -- マッチング元（任意）
sort_order      int
```

---

### 共通マスタ

#### 5. `public_unit_price_master` — 公開単価マスタ（read-only）
```sql
id              uuid PK
material_name   text NOT NULL
unit            text NOT NULL
unit_price      numeric(12,2) NOT NULL
category        text
source_name     text NOT NULL  -- 例: 国交省標準単価2026
source_url      text
published_at    date
created_at      timestamptz
updated_at      timestamptz
```
- 運営側でメンテナンス（半年〜年1回更新）
- ユーザーは「自社マスタへコピー」操作で `unit_price_master` にコピー
- コピー時は `source_master_id` で参照を保持

---

### 図面PDF・解析結果

#### 6. `drawings` — アップロードされた図面PDF
```sql
id              uuid PK
owner_user_id   uuid FK → users.id  -- ★ 所有者は個人（RLSキー）
company_id      uuid FK → companies.id  -- 紐づき会社（法人プラン時のみ。nullable）
file_name       text NOT NULL
storage_path    text NOT NULL  -- Supabase Storage
page_count      int
file_size_bytes bigint
created_at      timestamptz
deleted_at      timestamptz
```
**所有モデル:** 拾い出してもらった図面は**個人所有**。法人プランでも各メンバーの図面は個人に紐づく。
グループへの共有は `group_shares` 経由で本人判断。

#### 7. `extractions` — 拾い出し結果
```sql
id              uuid PK
drawing_id      uuid FK → drawings.id
owner_user_id   uuid FK → users.id  -- ★ 所有者は個人（RLSキー）
company_id      uuid FK → companies.id  -- 紐づき会社（nullable）
status          text CHECK (status IN ('pending', 'processing', 'done', 'failed'))
result_json     jsonb  -- {materials: [{name, diameter, quantity}], notes: [...]}
contains_price  boolean DEFAULT false  -- 金額情報を含むかフラグ（共有時の判定用）
processed_at    timestamptz
created_at      timestamptz
```

---

### グループ機能（v0.3）

#### 8. `project_groups` — プロジェクト/現場グループ
```sql
id              uuid PK
group_code      text UNIQUE NOT NULL  -- 6桁英数字の招待用ID（例: TK7P2M）
name            text NOT NULL
description     text
trust_level     text NOT NULL DEFAULT 'mixed' CHECK (trust_level IN ('trusted', 'mixed'))
                -- trusted: 自社グループ・身内（警告緩和）
                -- mixed:   同業他社混在の可能性あり（通常の3段階警告）
created_by      uuid FK → users.id  -- 作成は法人プラン所属ユーザーのみ
created_by_company  uuid FK → companies.id
created_at      timestamptz
deleted_at      timestamptz
```
**制約:** `created_by_company` が NOT NULL であり、かつ該当会社の `plan IN ('team_5','team_10','team_unlimited')` であることをトリガー or アプリ層で検証。

#### 9. `project_group_members` — グループメンバー
```sql
group_id        uuid FK → project_groups.id
user_id         uuid FK → users.id
company_id      uuid FK → companies.id  -- 会社単位で可視化
role            text CHECK (role IN ('owner', 'member'))
joined_at       timestamptz
PRIMARY KEY (group_id, user_id)
```

#### 10. `group_shares` — グループ共有アイテム
```sql
id              uuid PK
group_id        uuid FK → project_groups.id
shared_by       uuid FK → users.id
shared_by_company  uuid FK → companies.id
content_type    text CHECK (content_type IN ('drawing', 'extraction', 'quote', 'memo'))
content_id      uuid  -- ポリモーフィック参照
contains_price  boolean DEFAULT false  -- 金額情報の有無
confirmation_level  text CHECK (confirmation_level IN ('green', 'yellow', 'red'))
shared_at       timestamptz
revoked_at      timestamptz  -- 共有取り消し
```

#### 11. `group_invitations` — グループ招待・参加申請
```sql
id              uuid PK
group_id        uuid FK → project_groups.id
invited_by      uuid FK → users.id  -- 招待者（または承認者）
invitee_email   text  -- メール招待時（nullable）
invitee_user_id uuid FK → users.id  -- ID入力/リンク経由で申請してきたユーザー
invitation_type text CHECK (invitation_type IN ('link', 'qr', 'id_input', 'email'))
status          text CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
token           text UNIQUE  -- 招待リンクのトークン
expires_at      timestamptz
created_at      timestamptz
responded_at    timestamptz
```
**フロー:**
- メイン: 作成者がリンク/QR発行 → 被招待者がクリック/スキャン → `status='pending'` で作成者に通知 → 承認で `approved`
- サブ: 被招待者が `group_code` を手入力 → 参加申請 → 作成者承認

#### 12. `share_logs` — 共有時の判断ログ（追跡用）
```sql
id              uuid PK
group_id        uuid FK → project_groups.id
user_id         uuid FK → users.id  -- 共有を実行した人
company_id      uuid FK → companies.id
content_type    text
content_id      uuid
confirmation_level  text  -- 表示された確認画面の強度
auto_detected_keywords  text[]  -- 自動検出で引っかかったキーワード
member_snapshot jsonb  -- 共有時点のグループメンバー会社一覧
action          text CHECK (action IN ('shared', 'cancelled'))
created_at      timestamptz
```
- 監査ログ。後から「誰がいつ何を共有したか」を完全追跡可能
- メンバーが変動しても、共有時点のスナップショットを保持

---

### 課金（v0.1〜）

#### 13. `subscriptions` — サブスクリプション
```sql
id              uuid PK
company_id      uuid FK → companies.id  -- 個人プランの場合は個人専用のcompaniesレコード
plan            text CHECK (plan IN ('individual', 'team_5', 'team_10', 'team_unlimited'))
status          text CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing'))
provider        text CHECK (provider IN ('stripe', 'revenuecat', 'invoice'))
provider_subscription_id  text
monthly_amount_jpy  int  -- 1480 / 9800 / 16800 / 29800
current_period_end  timestamptz
created_at      timestamptz
updated_at      timestamptz
```

---

### DM機能（v0.2以降に予約）

スキーマ予約のみ。実装は v0.2 以降。

#### 14. `direct_messages`（予約）
```sql
id              uuid PK
from_user_id    uuid FK → users.id
to_user_id      uuid FK → users.id
group_id        uuid FK → project_groups.id  -- グループ文脈のDMの場合
body            text
attachment_path text
created_at      timestamptz
read_at         timestamptz
```

---

## ER概要

```
users ─┬─ company_member ─── companies ─┬─ unit_price_master
       │                                ├─ quotes ─── quote_items
       │                                ├─ subscriptions
       │                                └─ drawings ─── extractions
       │
       └─ project_group_members ─── project_groups ─┬─ group_shares ─── share_logs
                                                    └─ drawings (group紐付け)

public_unit_price_master  (read-only / 全ユーザー閲覧可)
```

---

## マイグレーション順序（v0.1）

v0.1 で作成するテーブル:
1. `users`（Supabase Auth拡張）
2. `companies`
3. `company_member`
4. `subscriptions`
5. `public_unit_price_master`（運営が初期データ投入）
6. `unit_price_master`
7. `quotes`
8. `quote_items`

v0.2追加:
9. `drawings`
10. `extractions`

v0.3追加:
11. `project_groups`（group_code・trust_level付き）
12. `project_group_members`
13. `group_invitations`
14. `group_shares`
15. `share_logs`
16. （`direct_messages` は必要になったら）

---

## 次のアクション

1. このスキーマをオーナーがレビュー
2. Supabaseプロジェクトを初期化（ローカル開発環境セットアップ）
3. v0.1分のマイグレーションSQL生成
4. RLSポリシーの具体実装
