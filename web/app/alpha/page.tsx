import { redirect } from "next/navigation";

/**
 * /alpha は廃止。LP は / に一本化。
 * 既に配布済みの /alpha リンクを踏んだ人を / に転送する。
 */
export default function AlphaPage() {
  redirect("/");
}
