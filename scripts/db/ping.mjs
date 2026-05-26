import { admin } from "./client.mjs";

const { data, error } = await admin.from("users").select("email").limit(3);
if (error) {
  console.error("FAIL:", error);
  process.exit(1);
}
console.log("OK - Supabase admin client connected.");
console.log(`Sample (${data.length} users):`, data.map((u) => u.email));
