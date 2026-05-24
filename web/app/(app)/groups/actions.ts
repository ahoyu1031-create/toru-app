"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserPlan } from "@/lib/get-plan";
import { canCreateGroup } from "@/lib/plan";

function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  // D案: グループ作成は team プラン以上のみ。個人/トライアルは参加のみ可。
  const plan = await getUserPlan(user.id);
  if (!canCreateGroup(plan)) {
    return { error: "グループの作成はチームプラン以上で可能です。プランをアップグレードしてください。" };
  }

  const { data: membership } = await supabase
    .from("company_member")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const trust_level = formData.get("trust_level") as string;

  if (!name) return { error: "グループ名は必須です" };

  // UUID をサーバー側で生成（RETURNING を使わず RLS の鶏と卵問題を回避）
  const { randomUUID } = await import("crypto");
  const groupId = randomUUID();
  const group_code = generateGroupCode();

  // admin クライアントで INSERT（SELECT ポリシーに依存しない）
  const admin = createAdminClient();
  const { error } = await admin
    .from("project_groups")
    .insert({
      id: groupId,
      group_code,
      name,
      description,
      trust_level: trust_level === "trusted" ? "trusted" : "mixed",
      created_by: user.id,
      created_by_company: membership?.company_id ?? null,
    });

  if (error) return { error: "グループの作成に失敗しました" };

  // 作成者をオーナーとして追加
  await admin.from("project_group_members").insert({
    group_id: groupId,
    user_id: user.id,
    company_id: membership?.company_id ?? null,
    role: "owner",
  });

  revalidatePath("/groups");
  return { groupId };
}

export async function joinGroupByCode(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  // adminClient で RLS をバイパス（非メンバーでも招待コードから参加できる）
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("project_groups")
    .select("id, name")
    .eq("group_code", code.toUpperCase().trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (!group) return { error: "グループが見つかりません" };

  // 既にメンバーなら即リダイレクト
  const { data: existing } = await supabase
    .from("project_group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { groupId: group.id, groupName: group.name, alreadyMember: true };

  // 既に申請済みかチェック（adminで確実に取得）
  const { data: pendingReq } = await admin
    .from("group_join_requests")
    .select("status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (pendingReq?.status === "pending") return { pending: true, groupName: group.name };

  // 拒否済み・承認済み退出 → 既存行を pending に更新して再申請
  if (pendingReq?.status === "rejected" || pendingReq?.status === "approved") {
    await admin
      .from("group_join_requests")
      .update({ status: "pending", resolved_at: null })
      .eq("group_id", group.id)
      .eq("user_id", user.id);
    revalidatePath("/groups");
    revalidatePath("/groups/join");
    return { pending: true, groupName: group.name };
  }

  // 申請を新規作成
  const { error } = await admin.from("group_join_requests").insert({
    group_id: group.id,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { pending: true, groupName: group.name };
    return { error: `申請に失敗しました: ${error.message}` };
  }

  revalidatePath("/groups");
  revalidatePath("/groups/join");
  return { pending: true, groupName: group.name };
}

export async function approveJoinRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const admin = createAdminClient();

  const { data: req } = await admin
    .from("group_join_requests")
    .select("group_id, user_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { error: "申請が見つかりません" };

  // 操作者がオーナーか確認
  const { data: ownership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", req.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownership?.role !== "owner") return { error: "権限がありません" };

  // メンバー追加
  await admin.from("project_group_members").insert({
    group_id: req.group_id,
    user_id: req.user_id,
    role: "member",
  });

  // 申請ステータス更新
  await admin
    .from("group_join_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath(`/groups/${req.group_id}`);
  return { ok: true };
}

export async function rejectJoinRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const admin = createAdminClient();

  const { data: req } = await admin
    .from("group_join_requests")
    .select("group_id, user_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { error: "申請が見つかりません" };

  const { data: ownership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", req.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownership?.role !== "owner") return { error: "権限がありません" };

  await admin
    .from("group_join_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath(`/groups/${req.group_id}`);
  return { ok: true };
}

export async function inviteUserById(groupId: string, targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const admin = createAdminClient();

  // オーナー確認
  const { data: ownership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownership?.role !== "owner") return { error: "権限がありません" };

  // 招待対象ユーザー確認
  const { data: targetUser } = await admin
    .from("users")
    .select("id, display_name")
    .eq("id", targetUserId.trim())
    .maybeSingle();
  if (!targetUser) return { error: "ユーザーが見つかりません" };

  // 既にメンバーか確認
  const { data: existing } = await admin
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId.trim())
    .maybeSingle();
  if (existing) return { error: `${targetUser.display_name ?? "このユーザー"}は既にメンバーです` };

  const { error } = await admin.from("project_group_members").insert({
    group_id: groupId,
    user_id: targetUserId.trim(),
    role: "member",
  });

  if (error) return { error: "招待に失敗しました" };

  revalidatePath(`/groups/${groupId}`);
  return { ok: true, displayName: targetUser.display_name ?? "メンバー" };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  await supabase
    .from("project_groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", groupId)
    .eq("created_by", user.id);

  revalidatePath("/groups");
  return { ok: true };
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  await supabase
    .from("project_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath("/groups");
  return { ok: true };
}

export async function summarizeGroupMessages(groupId: string): Promise<{ summary: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "権限がありません" };

  const { data: messages } = await supabase
    .from("group_messages")
    .select("body, created_at, user_id")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!messages || messages.length === 0) return { summary: "まだメッセージがありません。" };

  const { data: members } = await supabase
    .from("project_group_members")
    .select("user_id, users(display_name)")
    .eq("group_id", groupId);

  const nameMap = new Map(
    (members ?? []).map((m: any) => [m.user_id, (m.users as any)?.display_name ?? "不明"])
  );

  const transcript = [...messages]
    .reverse()
    .map((m) => `${nameMap.get(m.user_id) ?? "不明"}: ${m.body}`)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `以下はグループチャットの最近のメッセージです。3〜5文で日本語で簡潔に要約してください。\n\n${transcript}`,
      },
    ],
  });

  const summary = response.content[0].type === "text" ? response.content[0].text : "要約できませんでした。";
  return { summary };
}

export async function askGroupChat(groupId: string, question: string): Promise<{ answer: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "権限がありません" };

  const { data: messages } = await supabase
    .from("group_messages")
    .select("body, created_at, user_id")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (!messages || messages.length === 0) return { answer: "まだメッセージがありません。" };

  const { data: members } = await supabase
    .from("project_group_members")
    .select("user_id, users(display_name)")
    .eq("group_id", groupId);

  const nameMap = new Map(
    (members ?? []).map((m: any) => [m.user_id, (m.users as any)?.display_name ?? "不明"])
  );

  const transcript = [...messages]
    .reverse()
    .map((m) => `${nameMap.get(m.user_id) ?? "不明"}: ${m.body}`)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `以下はプロジェクトグループのチャット履歴です。\n\n${transcript}\n\n質問: ${question}\n\nチャット履歴を参考に、質問に日本語で簡潔に答えてください。チャット履歴に情報がない場合はその旨を伝えてください。`,
      },
    ],
  });

  const answer = response.content[0].type === "text" ? response.content[0].text : "回答できませんでした。";
  return { answer };
}

export async function recordGroupFile(
  groupId: string,
  fileInfo: {
    fileId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "権限がありません" };

  const admin = createAdminClient();

  const { error: dbError } = await admin
    .from("group_files")
    .insert({
      id: fileInfo.fileId,
      group_id: groupId,
      user_id: user.id,
      storage_path: fileInfo.storagePath,
      original_name: fileInfo.fileName,
      mime_type: fileInfo.mimeType,
      file_size: fileInfo.fileSize,
    });

  if (dbError) {
    await admin.storage.from("group-files").remove([fileInfo.storagePath]);
    return { error: "ファイル情報の保存に失敗しました" };
  }

  const msgBody = `__file__:${fileInfo.fileId}:${fileInfo.mimeType}:${fileInfo.fileSize}:${encodeURIComponent(fileInfo.fileName)}`;
  await admin.from("group_messages").insert({
    group_id: groupId,
    user_id: user.id,
    body: msgBody,
  });

  return { ok: true };
}

export async function getGroupFileUrl(
  fileId: string,
  forDownload = false
): Promise<{ url: string; fileName: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("group_files")
    .select("storage_path, original_name, group_id")
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!file) return { error: "ファイルが見つかりません" };

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", file.group_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "権限がありません" };

  const { data: signed } = await admin.storage
    .from("group-files")
    .createSignedUrl(file.storage_path, 3600, {
      download: forDownload ? file.original_name : false,
    });

  if (!signed?.signedUrl) return { error: "URLの生成に失敗しました" };
  return { url: signed.signedUrl, fileName: file.original_name };
}

export async function getGroupFiles(groupId: string): Promise<
  { files: Array<{ id: string; original_name: string; mime_type: string; file_size: number; created_at: string; user_id: string }> } | { error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "権限がありません" };

  const admin = createAdminClient();
  const { data: files } = await admin
    .from("group_files")
    .select("id, original_name, mime_type, file_size, created_at, user_id")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return { files: files ?? [] };
}

export async function sendGroupMessage(groupId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) return { error: "本文が不正です" };

  // メンバーシップ確認
  const { data: membership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { error: "グループのメンバーではありません" };

  // INSERT は adminClient で RLS をバイパス（メンバー確認済みのため安全）
  const admin = createAdminClient();
  const { error } = await admin.from("group_messages").insert({
    group_id: groupId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) return { error: "送信に失敗しました" };
  return { ok: true };
}
