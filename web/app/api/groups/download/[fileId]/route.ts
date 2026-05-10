import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("group_files")
    .select("storage_path, original_name, mime_type, group_id")
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!file) return new NextResponse("Not Found", { status: 404 });

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", file.group_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const { data: signed } = await admin.storage
    .from("group-files")
    .createSignedUrl(file.storage_path, 60);

  if (!signed?.signedUrl) return new NextResponse("Error", { status: 500 });

  // Supabase からストリームとして取得してそのまま返す
  const upstream = await fetch(signed.signedUrl);
  if (!upstream.ok) return new NextResponse("Error fetching file", { status: 500 });

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
    },
  });
}
