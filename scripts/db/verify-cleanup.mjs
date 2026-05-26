/**
 * P0-① STEP C: 重複所属クリーンアップ 検証
 *
 * 確認項目:
 *   (1) company_member に user_id 重複が存在しないこと（UNIQUE 制約効いてる）
 *   (2) 孤児 company（メンバー0の会社）が存在しないこと
 *   (3) 全ユーザーの所属数（1社のみが正常）
 *   (4) is_unlimited / is_alpha_tester の現状一覧
 */
import { admin } from "./client.mjs";

const ok = (s) => console.log(`✅ ${s}`);
const ng = (s) => console.log(`❌ ${s}`);
const info = (s) => console.log(`ℹ️  ${s}`);
const section = (s) => console.log(`\n=== ${s} ===`);

// ---------- (1) 重複所属チェック ----------
section("(1) company_member の重複 user_id チェック");
{
  const { data, error } = await admin.from("company_member").select("user_id");
  if (error) { ng(error.message); process.exit(1); }
  const counts = new Map();
  data.forEach((r) => counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
  const dupes = [...counts.entries()].filter(([, c]) => c > 1);
  if (dupes.length === 0) ok(`重複なし（全 ${data.length} 件、ユニーク ${counts.size} ユーザー）`);
  else { ng(`重複あり: ${dupes.length} ユーザー`); dupes.forEach(([u, c]) => console.log(`   user_id=${u} → ${c}社`)); }
}

// ---------- (2) 孤児 company チェック ----------
section("(2) メンバー0の孤児会社チェック");
{
  const [companies, members] = await Promise.all([
    admin.from("companies").select("id, name, plan"),
    admin.from("company_member").select("company_id"),
  ]);
  if (companies.error || members.error) { ng("query failed"); process.exit(1); }
  const memberSet = new Set(members.data.map((r) => r.company_id));
  const orphans = companies.data.filter((c) => !memberSet.has(c.id));
  if (orphans.length === 0) ok(`孤児なし（全 ${companies.data.length} 社にメンバー存在）`);
  else { ng(`孤児 ${orphans.length} 社`); orphans.forEach((c) => console.log(`   ${c.id} | ${c.name} | plan=${c.plan}`)); }
}

// ---------- (3) ユーザー所属数 ----------
section("(3) ユーザー別 所属会社数");
{
  const { data, error } = await admin
    .from("users")
    .select("id, email, company_member(company_id, companies(name, plan))");
  if (error) { ng(error.message); process.exit(1); }
  data.forEach((u) => {
    const cms = Array.isArray(u.company_member) ? u.company_member : u.company_member ? [u.company_member] : [];
    const detail = cms.map((m) => {
      const co = Array.isArray(m.companies) ? m.companies[0] : m.companies;
      return `${co?.name}(${co?.plan ?? "trial"})`;
    }).join(", ");
    const icon = cms.length === 1 ? "✅" : cms.length === 0 ? "⚠️ " : "❌";
    console.log(`${icon} ${u.email} → ${cms.length}社 [${detail}]`);
  });
}

// ---------- (4) フラグ一覧 ----------
section("(4) is_unlimited / is_alpha_tester 現状");
{
  const { data, error } = await admin
    .from("users")
    .select("email, is_unlimited, is_alpha_tester")
    .or("is_unlimited.eq.true,is_alpha_tester.eq.true");
  if (error) { ng(error.message); process.exit(1); }
  if (data.length === 0) info("該当ユーザーなし");
  data.forEach((u) => {
    const role = u.is_unlimited ? "🟣 developer" : u.is_alpha_tester ? "🟠 alpha" : "—";
    console.log(`${role}  ${u.email}`);
  });
}

console.log("\n=== Done ===");
