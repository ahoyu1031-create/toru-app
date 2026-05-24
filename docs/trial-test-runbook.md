# 無料トライアル 動作確認ランブック

仮さんアカウント (`aoki1031movie@gmail.com`) を使ってトライアル機能を実機テストする手順。
本番DB操作なので、開始前にバックアップ意識を持つこと。

---

## 1. 仮さんを「トライアル状態」に切替

Supabase SQL Editor で実行:

```sql
-- 仮さんの所属会社を取得して trial 状態にリセット
UPDATE companies
SET plan = NULL,
    trial_drawings_used = 0,
    trial_started_at = NOW(),
    trial_ended_reason = NULL
WHERE created_by = (
  SELECT id FROM users WHERE email = 'aoki1031movie@gmail.com'
);

-- 確認
SELECT name, plan, trial_drawings_used, trial_started_at
FROM companies
WHERE created_by = (SELECT id FROM users WHERE email = 'aoki1031movie@gmail.com');
```

期待: `plan=null / trial_drawings_used=0 / trial_started_at=今`

---

## 2. ブラウザで本番にログイン

URL: https://toru-app.vercel.app/

- ログイン: `aoki1031movie@gmail.com`
- ダッシュボード上部に **青いバナー**「🎁 無料体験中: 図面解析 残り **10** 回 / あと **7** 日 [プランを見る →]」が出る

---

## 3. /settings/plan で残数表示確認

- 現在のプラン: **「無料体験中」** + 緑バッジ
- 緑色の体験ボックス内に「図面解析: 残り **10** 回（全10回）/ あと **7** 日」
- 下の「プラン選択」セクションは個人/team×3 の4枚表示（free は削除済）

---

## 4. 図面解析を実行して消費確認

1. `/drawings/new` から PDF アップロード → 解析実行
2. 解析成功後、ダッシュボードに戻ると残数が **9** に減ってる
3. 7回繰り返し → 残3回になった瞬間バナーが **黄色に切替**
4. さらに3回 → 残0回 → バナーが **赤** に「無料体験の解析回数（10回）を使い切りました」
5. 図面解析実行しようとすると **API が 402 返却**（クライアント側でエラートースト確認）

---

## 5. 期間切れの確認（任意）

10回使う前に期間切れの動作も見たい場合:

```sql
UPDATE companies
SET trial_started_at = NOW() - INTERVAL '8 days'
WHERE created_by = (SELECT id FROM users WHERE email = 'aoki1031movie@gmail.com');
```

→ ダッシュボード再読み込みで赤バナー「無料体験期間（7日間）が終了しました」が出るはず。

---

## 6. テスト終了後の復元（重要・忘れずに）

```sql
UPDATE companies
SET plan = 'team_unlimited',
    trial_drawings_used = 999,
    trial_started_at = '2026-05-21 12:19:25.458431+00',  -- 元の値
    trial_ended_reason = 'grandfathered'
WHERE created_by = (
  SELECT id FROM users WHERE email = 'aoki1031movie@gmail.com'
);
```

→ 元の `team_unlimited / cus_UYcp1IlbR7m5NU` 状態に戻る。

---

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| バナーが出ない | `getCompanyTrial` が null 返してる | ブラウザキャッシュクリア / Next.js の revalidate |
| 残数が減らない | `saveDrawingAnalysis` の trial increment が失敗 | サーバーログ `[saveDrawingAnalysis] trial increment failed` を確認 |
| 図面解析が 402 で止まらない | `is_unlimited=true` がついてる | `SELECT is_unlimited FROM users WHERE email='aoki1031movie@gmail.com';` で確認、true なら false に |
| 青バナーじゃなく PlanStatusBar が出る | `plan` がまだ `team_unlimited` のまま | STEP 1 のUPDATE再実行 |
