# TORU 🏗️

**建設現場のAIアシスタント**

図面PDFをアップロードするだけで、AIが材料・数量・施工注意点を自動抽出。
「材料拾い1日 → 30秒」を実現します。

🌐 **本番サービス**: https://toru-app.vercel.app
📝 **アルファテスター募集中**（無料・期間中無制限）: https://forms.gle/dhtC7BnjkX7Dd8ac9

---

## このリポジトリについて

TORU は **建設業界出身の個人開発者** が「現場の課題」を解くために開発しているサービスです。

開発の透明性を保つため、ソースコードを公開しています（**Build in Public**）。

### できること

- 📐 図面PDFの自動解析（材料拾い出し / 施工注意点 / 取合い確認）
- 📊 解析結果をCSV / Excel エクスポート
- 💬 会社内グループチャット（@mention付き）
- 💳 Stripe による月額サブスクリプション
- 🎁 14日 / 20回の無料体験

### 技術スタック

- **Frontend**: Next.js 16 (App Router) / React 19 / Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Storage)
- **AI**: 大規模言語モデル（材料拾い出し特化）
- **Billing**: Stripe Subscriptions
- **Infra**: Vercel

---

## ⚠️ 参加・コントリビューションについて

**本リポジトリは「閲覧専用」として公開しています。**

- ❌ Issue は受け付けておりません
- ❌ Pull Request は受け付けておりません
- ❌ ソースコードの転載・再配布・商用利用は禁止です

サービスへのご要望・不具合報告は、本番サービス内の「フィードバック」機能よりお願いします。

---

## 開発者

**青木 悠** (Aoki Yu)
建設業界出身 / 個人開発者

- 🌐 サービス: https://toru-app.vercel.app
- 📨 連絡先: ahoyu1031@gmail.com

---

## ライセンス

© 2026 Aoki Yu. **All Rights Reserved.**

本ソースコードの著作権は開発者に帰属します。
閲覧目的以外での利用（コピー・改変・再配布・商用利用）は一切許可していません。
