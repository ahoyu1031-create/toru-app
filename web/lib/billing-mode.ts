/**
 * 課金UI表示モード。Stripe の test/live 切替と独立して UI 側の出し分けを制御する。
 *
 * - "test" (デフォルト): Stripe テストモード運用中。プラン選択UIを隠し、アルファ枠誘導を表示
 * - "live": 本番課金モード。プラン選択UIを表示、アルファ枠誘導は控えめに
 *
 * 切替手順:
 *   1. Vercel 環境変数で NEXT_PUBLIC_BILLING_MODE=live を設定
 *   2. 再デプロイ
 *   3. Stripeキーも sk_live_* / pk_live_* / whsec_(live) に切り替えること
 *   4. Stripe Dashboard の Customer Portal 設定も Live で実施
 *
 * Why NEXT_PUBLIC_*?
 *   Server Component / Client Component 両方で参照したいため。
 *   秘匿情報ではなく単なる動作モード表示なので公開しても問題なし。
 */

export type BillingMode = "test" | "live";

export const BILLING_MODE: BillingMode =
  process.env.NEXT_PUBLIC_BILLING_MODE === "live" ? "live" : "test";

export const IS_LIVE_BILLING = BILLING_MODE === "live";
export const IS_TEST_BILLING = BILLING_MODE === "test";

/** アルファテスター申込フォームURL（Google Form等の外部URL） */
export const ALPHA_FORM_URL =
  process.env.NEXT_PUBLIC_ALPHA_FORM_URL ?? "https://forms.gle/dhtC7BnjkX7Dd8ac9";
