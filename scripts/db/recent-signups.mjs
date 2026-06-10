/**
 * 最近の新規登録ユーザーを一覧表示（誰が来たか・活性化したか確認用）
 * Usage: node scripts/db/recent-signups.mjs
 */
import { admin } from "./client.mjs";

// 把握している内部アカウント（自分）
const INTERNAL = new Set(["ahoyu1031@gmail.com"]);

function jst(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

// 1) auth ユーザー一覧
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listErr) { console.error(listErr); process.exit(1); }
const users = [...list.users].sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

// 2) users テーブルのフラグ（dev/alpha 判別用）
const { data: profiles } = await admin
  .from("users")
  .select("id, is_unlimited, is_alpha_tester");
const flagMap = new Map((profiles ?? []).map((p) => [p.id, p]));

// 3) 図面解析の活性化（user_id ごとの件数）
const { data: analyses } = await admin
  .from("drawing_analyses")
  .select("user_id")
  .is("deleted_at", null);
const analysisCount = new Map();
for (const a of analyses ?? []) {
  analysisCount.set(a.user_id, (analysisCount.get(a.user_id) ?? 0) + 1);
}

console.log(`\n=== 登録ユーザー: 全 ${users.length} 名 ===\n`);
console.log("登録日時(JST)             最終ログイン(JST)          解析  種別     メール");
console.log("-".repeat(108));

let external = 0;
for (const u of users) {
  const flags = flagMap.get(u.id) ?? {};
  const isInternal = INTERNAL.has(u.email ?? "");
  let kind = "一般";
  if (isInternal) kind = "★自分";
  else if (flags.is_alpha_tester) kind = "alpha";
  else if (flags.is_unlimited) kind = "unlim";
  const isExternal = !isInternal && !flags.is_unlimited && !flags.is_alpha_tester;
  if (isExternal) external++;
  const n = analysisCount.get(u.id) ?? 0;
  console.log(
    `${jst(u.created_at).padEnd(23)}  ${jst(u.last_sign_in_at).padEnd(23)}  ${String(n).padStart(3)}  ${kind.padEnd(6)}  ${u.email}`
  );
}

console.log("-".repeat(108));
console.log(`\n外部の登録（自分/unlimited/alpha を除く）: ${external} 名`);
console.log(`解析を1回以上した人: ${[...analysisCount.keys()].length} 名\n`);
