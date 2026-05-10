# TORU — 次のアクション（Supabase初期化）

作成: 2026-04-19

## 方針

Phase 0 残タスクのうち **Supabase初期化＋v0.1マイグレーション** から着手する。
デザインシステムは暫定パレットで走り、画面実装と並行で磨く。

---

## ①【オーナー実行タスク】Supabase側の準備

### Step 1: Supabaseアカウント・プロジェクト作成

1. https://supabase.com にアクセス → Sign up（GitHub認証推奨）
2. 「New Project」を押す
3. プロジェクト設定:
   - **Name**: `toru-dev`
   - **Database Password**: 強めのパスワード（後でアプリからは使わないが控えておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
   - **Plan**: Free（開発初期は無料で十分）
4. 作成完了まで約2-3分待つ

### Step 2: API情報の取得

プロジェクトダッシュボードの **Settings → API** から以下を控える:

- `Project URL`: 例 `https://xxxxxxxxxxxx.supabase.co`
- `anon public` key: 公開用キー（クライアント側で使う）
- `service_role` key: サーバー専用キー（絶対に公開しない）

→ これを教えてもらえれば、秘書側で `.env` テンプレを準備します。
   共有方法は任意（このチャットに貼る or メモ）。

### Step 3（任意）: Supabase CLI のインストール

ローカル開発・マイグレーション管理に使います。
後で秘書側が実行する手順をまとめるので、**今は不要**。
先にプロジェクト作成だけ進めてもらえればOK。

---

## ②【秘書・開発側タスク】SQL・コード準備

オーナーがプロジェクト作成している間に、こっちで以下を準備します:

### 1. マイグレーションSQL作成（v0.1分）
作成するテーブル:
- [ ] `users`（Supabase Auth 連動）
- [ ] `companies`（industry_tag含む）
- [ ] `company_member`
- [ ] `subscriptions`（月額3段階対応）
- [ ] `public_unit_price_master`（read-only、シード用）
- [ ] `unit_price_master`（会社別、RLS）
- [ ] `quotes`（会社別、RLS）
- [ ] `quote_items`（subtotal は GENERATED カラム）

### 2. RLSポリシー記述
- `unit_price_master`: 所属会社のメンバーのみ R/W
- `quotes` / `quote_items`: 所属会社のメンバーのみ R/W
- `public_unit_price_master`: 全認証ユーザー read-only
- `companies`: 所属メンバーのみ参照、Owner のみ更新

### 3. シードデータ
- 業種タグの選択肢（enum的扱い）
- `public_unit_price_master` のサンプル5件（実データは後でリサーチ部門から投入）

### 4. 疎通確認スクリプト
- Node.js で簡易CRUDを叩いてRLSが効いてるか検証

### 5. セットアップ手順書
- `backend-setup.md` として手順をドキュメント化

---

## ③ 完了後の次フェーズ

1. **デザインシステム 最低限**（主要カラー・タイポ・主要コンポーネントのみ）
2. **Web版プロジェクト初期化**（Next.js or Expo Web）
3. **認証画面プロト → 単価マスタ CRUD 画面**

---

## オーナーがやること（超要約）

✅ Supabaseでアカウント作って `toru-dev` プロジェクトを作る
✅ Project URL と anon key / service_role key を秘書に渡す

これだけ！あとは秘書側で進めます。
