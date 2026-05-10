import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "フォームデータの解析に失敗しました" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const groupId = formData.get("groupId") as string | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }
  if (!groupId) {
    return NextResponse.json({ error: "グループIDが必要です" }, { status: 400 });
  }

  // メンバーシップ確認
  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "グループのメンバーではありません" }, { status: 403 });
  }

  // バリデーション
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは50MB以下にしてください" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "対応していないファイル形式です（JPEG/PNG/GIF/WebP/PDF）" }, { status: 400 });
  }

  const fileId = randomUUID();
  const ext = file.name.split(".").pop() ?? "";
  const storagePath = `${groupId}/${fileId}${ext ? `.${ext}` : ""}`;

  const admin = createAdminClient();

  // Storageにアップロード
  const { error: uploadError } = await admin.storage
    .from("group-files")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }

  // group_filesテーブルに記録
  const { data: fileRow, error: dbError } = await admin
    .from("group_files")
    .insert({
      id: fileId,
      group_id: groupId,
      user_id: user.id,
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    })
    .select("id")
    .single();

  if (dbError) {
    await admin.storage.from("group-files").remove([storagePath]);
    return NextResponse.json({ error: "ファイル情報の保存に失敗しました" }, { status: 500 });
  }

  // チャットメッセージを送信（ファイル参照埋め込み）
  const msgBody = `__file__:${fileRow.id}:${file.type}:${file.size}:${encodeURIComponent(file.name)}`;
  await admin.from("group_messages").insert({
    group_id: groupId,
    user_id: user.id,
    body: msgBody,
  });

  return NextResponse.json({
    ok: true,
    fileId: fileRow.id,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  });
}
