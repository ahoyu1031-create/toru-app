import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { email, password, display_name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();

  // admin でユーザー作成 → email_confirm: true でメール確認スキップ
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { display_name: display_name || email.split("@")[0] },
    email_confirm: true,
  });

  if (createError) {
    const msg = createError.message.includes("already registered")
      ? "このメールアドレスはすでに登録されています"
      : createError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 作成直後にセッションを発行（signInWithPassword）
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signIn.session) {
    // ユーザー作成は成功しているのでログインページへ誘導
    return NextResponse.json({ ok: true, session: false });
  }

  return NextResponse.json({ ok: true, session: true });
}
