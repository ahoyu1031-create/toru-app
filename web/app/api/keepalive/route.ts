import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Supabase無料プランは7日間アクティビティが無いと自動一時停止されるため、
// Vercel Cron（vercel.json）が毎日1回ここを叩いてDBアクセスを発生させる。
export async function GET() {
  const admin = createAdminClient();
  const { error } = await admin.from("companies").select("id").limit(1);
  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
