import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // 環境変数未設定でもビルドは通すが、Stripe API 呼び出し時に明示エラーを出す
  console.warn("[stripe] STRIPE_SECRET_KEY is not set. Billing API will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export function requireStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return stripe;
}
