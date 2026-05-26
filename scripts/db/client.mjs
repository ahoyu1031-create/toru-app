import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", "web", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Looked in: web/.env.local");
  process.exit(1);
}

export const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function table(prefix = "") {
  return (s) => `${prefix}${s}`;
}

export async function exit(promise) {
  try {
    const result = await promise;
    if (result?.error) {
      console.error("ERROR:", result.error);
      process.exit(1);
    }
    return result;
  } catch (e) {
    console.error("THROWN:", e);
    process.exit(1);
  }
}
