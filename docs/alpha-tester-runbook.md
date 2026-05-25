# アルファテスター運用ランブック

MVP公開期間中、決済を経由せず無制限で TORU を使ってもらうための
「アルファテスター」プログラムの**承認・取消・確認**手順をまとめる。

- 申込フォーム: https://forms.gle/dhtC7BnjkX7Dd8ac9
- 通知先メール: `ahoyu1031@gmail.com`
- 承認 SLA: **1〜2 営業日以内**
- 利用条件: **無制限 / フィードバック歓迎 / Live 切替後の永久半額（先着10名）**

---

## 0. 前提知識（フラグの違い）

| 種類 | カラム | 用途 | バッジ色 |
|---|---|---|---|
| developer | `users.is_unlimited` | 青木専用（永続）| 🟣 紫 |
| alpha tester | `users.is_alpha_tester` | 一般募集（運用中）| 🟠 オレンジ |

⚠️ **`is_unlimited` を一般ユーザーに付けない。**
開発者専用なので、アルファ承認は必ず `is_alpha_tester=true` を使うこと。

判定ロジック（`web/lib/user-flags.ts`）:
```ts
hasUnlimitedAccess = is_unlimited || is_alpha_tester
```

両方とも「無制限・課金スキップ・回数バー非表示」になる。

---

## 1. 申込通知を受信したら

Google Form 送信時、`ahoyu1031@gmail.com` に通知が来る（フォーム設定: 「回答 → メール通知」 ON）。

含まれる情報:
- 氏名
- メールアドレス
- 業種（建築・電気・配管・その他）
- 会社名
- 利用目的 / フィードバック意欲

---

## 2. 承認判断基準

**原則「全員承認」**。MVP段階では母数を増やすことが最優先。

却下するケースのみ書き出す:
| ケース | 対応 |
|---|---|
| 明らかなスパム（適当な英数字・テスト送信）| 無視 |
| 競合企業のメールドメイン（要調査）| 一旦保留 → 青木に相談 |
| 同一人物の重複申込 | 既存アカウントの状態を SQL で確認、未承認なら承認 |

---

## 3. 承認 SQL（コピペ用）

Supabase SQL Editor で実行。

```sql
-- 承認: is_alpha_tester を true に
UPDATE users
SET is_alpha_tester = true
WHERE email = 'ここに申込者メール'
RETURNING email, is_unlimited, is_alpha_tester;
```

期待結果:
```
| email                | is_unlimited | is_alpha_tester |
| -------------------- | ------------ | --------------- |
| applicant@gmail.com  | false        | true            |
```

⚠️ **`is_unlimited=true` になっていたら間違い**。即修正:
```sql
UPDATE users SET is_unlimited = false WHERE email = 'applicant@gmail.com';
```

### ユーザーがまだ TORU にサインアップしてない場合

申込者のメールアドレスを TORU 側で見つけられない（`users` テーブルに存在しない）。
→ **「先に TORU にアカウント登録してください」を伝えてから承認**。

承認連絡テンプレ（次セクション）で「先にこちらから登録 → 完了後ご連絡ください」と案内する運用にしても良い。

---

## 4. 承認連絡テンプレ

### メール（推奨）

```
件名: 【TORU】アルファテスター承認のご連絡

XX 様

この度は TORU アルファテスタープログラムへお申し込みいただき
誠にありがとうございます。

承認手続きが完了しましたので、ご連絡いたします。

▼ ご利用方法
1. https://toru-app.vercel.app/login にアクセス
2. お申込みいただいたメールアドレスでログイン
3. すぐに無制限で図面解析機能をご利用いただけます

▼ 期間中の特典
- 図面解析: 無制限
- 全機能: 制限なし
- 正式リリース時: 全プラン半額（永久）※先着10名様

▼ お願い
ご利用中にお気づきの点・改善要望・不具合がございましたら、
画面右下の「フィードバック」ボタンよりお寄せください。
皆様の声を反映しながら改善を続けてまいります。

引き続き TORU をよろしくお願いいたします。

TORU 運営チーム
青木 悠
```

### X DM（短縮版）

```
TORUアルファテスター、承認しました🎉
そのまま https://toru-app.vercel.app/login からログインで
無制限で使えます。

気付いた点があれば画面右下のフィードバックボタンから
お気軽にどうぞ！
```

---

## 5. 状態確認 SQL

### 個別ユーザーの状態確認
```sql
SELECT
  email,
  is_unlimited,
  is_alpha_tester,
  created_at
FROM users
WHERE email = 'check@example.com';
```

### アルファテスター一覧
```sql
SELECT
  email,
  is_alpha_tester,
  is_unlimited,
  created_at
FROM users
WHERE is_alpha_tester = true OR is_unlimited = true
ORDER BY created_at DESC;
```

### アルファテスターの利用状況
```sql
SELECT
  u.email,
  COUNT(d.id) AS analyses_count,
  MAX(d.created_at) AS last_analysis
FROM users u
LEFT JOIN drawing_analyses d ON d.user_id = u.id
WHERE u.is_alpha_tester = true
GROUP BY u.email
ORDER BY analyses_count DESC;
```

---

## 6. 取消（不正利用時のみ）

通常運用では取消しない。明らかな不正利用・規約違反の場合のみ:

```sql
UPDATE users
SET is_alpha_tester = false
WHERE email = 'abuser@example.com'
RETURNING email, is_alpha_tester;
```

取消後はトライアル状態（`companies.plan=null`）に戻るので、
20回 / 14日 の通常無料体験が適用される。

---

## 7. Live 切替時の永久半額対応（将来）

正式リリース時、先着10名のアルファテスターに「永久半額クーポン」を付与する。

実装方針（未実装メモ）:
- Stripe Coupon を作成: `ALPHA_FOREVER_50` (50% off forever)
- 該当ユーザーの Stripe customer に attach
- または、Supabase 側で `users.coupon_code` カラムを持ち Checkout 時に自動適用

実装タスクは [[project-toru-deployment]] に追記予定。

---

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| 承認後もログインで「無料体験中」と表示 | ブラウザキャッシュ | ハードリロード（Ctrl+Shift+R）/ 一度ログアウト |
| バッジが「アルファ」ではなく「developer」（紫）| `is_unlimited=true` を付けてしまった | 即 `is_unlimited=false` に修正 |
| バッジが何も出ない | キャッシュ or revalidate 未実行 | 数分待つ / 再ログイン |
| Form 通知メールが届かない | Google Form の通知設定 OFF | フォーム編集 → 「回答」タブ → メール通知 ON |
| 申込者のメールが users に存在しない | TORU 未登録 | 先に登録依頼 → 完了後承認 |
| 承認SQLで 0 rows | メアド typo / 大文字小文字 | `WHERE LOWER(email) = LOWER('xxx')` で再確認 |

---

## 関連ドキュメント

- 無料トライアル動作確認: `docs/trial-test-runbook.md`
- フラグ判定ロジック: `web/lib/user-flags.ts`
- アルファ募集 LP: `/alpha`（公開ページ）
- 申込フォーム: https://forms.gle/dhtC7BnjkX7Dd8ac9
