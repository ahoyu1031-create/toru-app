"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendGroupMessage, getGroupFileUrl, recordGroupFile } from "../actions";
import { Send, AtSign, Paperclip, FileText, ImageIcon, Download } from "lucide-react";
import { useToast } from "@/components/toast-context";
import { useMentions } from "@/components/mention-context";
import { FileConfirmModal } from "@/components/file-confirm-modal";

type Member = {
  user_id: string;
  role: string;
  users: { display_name: string | null } | null;
};

type Message = {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name?: string;
};

type GroupFile = {
  id: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  user_id: string;
};

function resolveName(userId: string, members: Member[], myUserId?: string, myDisplayName?: string): string {
  if (myUserId && userId === myUserId && myDisplayName) return myDisplayName;
  return members.find((m) => m.user_id === userId)?.users?.display_name ?? "名前未設定";
}

function buildMessages(
  rows: Array<{ id: string; group_id: string; user_id: string; body: string; created_at: string }>,
  members: Member[],
  myUserId?: string,
  myDisplayName?: string
): Message[] {
  return rows.map((r) => ({
    ...r,
    display_name: resolveName(r.user_id, members, myUserId, myDisplayName),
  }));
}

function getMentionTrigger(text: string, cursor: number): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@(\S*)$/);
  if (!match) return null;
  return { start: before.length - match[0].length, query: match[1] };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseFileMessage(body: string) {
  if (!body.startsWith("__file__:")) return null;
  const rest = body.slice("__file__:".length);
  const parts = rest.split(":");
  if (parts.length < 4) return null;
  const [fileId, mimeType, fileSizeStr, ...nameParts] = parts;
  const fileName = decodeURIComponent(nameParts.join(":"));
  const fileSize = parseInt(fileSizeStr, 10);
  if (!fileId || !fileName || isNaN(fileSize)) return null;
  return { fileId, fileName, mimeType, fileSize };
}

function FileMessageCard({
  fileId,
  fileName,
  mimeType,
  fileSize,
  isMe,
}: {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isMe: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const isImage = mimeType.startsWith("image/");

  // 画像は自動でプレビューURL取得（チャット内サムネイル用）
  useEffect(() => {
    if (!isImage) return;
    setPreviewLoading(true);
    getGroupFileUrl(fileId).then((result) => {
      setPreviewLoading(false);
      if ("url" in result) setPreviewUrl(result.url);
    });
  }, [fileId, isImage]);

  // カード本体クリック → 新タブでプレビュー表示
  async function handlePreview() {
    if (isImage && previewUrl) {
      window.open(previewUrl, "_blank");
      return;
    }
    const result = await getGroupFileUrl(fileId);
    if ("url" in result) window.open(result.url, "_blank");
  }

  // ダウンロードボタン → PCに保存（blob経由で確実にダウンロード）
  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/groups/download/${fileId}`);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = `/api/groups/download/${fileId}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // 画像: プレビューカード（本体クリック→新タブ、↓ボタン→DL）
  if (isImage) {
    return (
      <div
        className="overflow-hidden rounded-xl"
        onClick={handlePreview}
        title="クリックしてプレビュー"
        style={{
          maxWidth: 240,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ minHeight: 140, background: "var(--color-bg)" }}
        >
          {previewLoading && (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--color-text-muted)" }}
            />
          )}
          {previewUrl && (
            <img
              src={previewUrl}
              alt={fileName}
              className="w-full object-cover"
              style={{ maxHeight: 200, display: "block", pointerEvents: "none" }}
            />
          )}
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>
              {fileName}
            </p>
            <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
              {formatBytes(fileSize)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:opacity-70"
            style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)", cursor: "default" }}
            title="ダウンロード"
          >
            <Download size={13} />
          </button>
        </div>
      </div>
    );
  }

  // PDF等ドキュメント: 左右どちらでも見やすいソリッドカード（本体クリック→新タブ、↓ボタン→DL）
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      onClick={handlePreview}
      title="クリックしてプレビュー"
      style={{
        maxWidth: 240,
        background: isMe ? "var(--color-primary)" : "var(--color-surface)",
        border: isMe ? "none" : "1px solid var(--color-border)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: isMe ? "rgba(255,255,255,0.2)" : "rgba(220,38,38,0.08)" }}
      >
        <FileText size={18} style={{ color: isMe ? "#fff" : "var(--color-danger)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold" style={{ color: isMe ? "#fff" : "var(--color-text)" }}>
          {fileName}
        </p>
        <p className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)" }}>
          {formatBytes(fileSize)}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:opacity-70"
        style={{
          background: isMe ? "rgba(255,255,255,0.2)" : "var(--color-primary-soft)",
          color: isMe ? "#fff" : "var(--color-primary)",
          cursor: "default",
        }}
        title="ダウンロード"
      >
        <Download size={13} />
      </button>
    </div>
  );
}

function MessageBody({
  body,
  isMe,
  myDisplayName,
}: {
  body: string;
  isMe: boolean;
  myDisplayName: string;
}) {
  const fileInfo = parseFileMessage(body);
  if (fileInfo) {
    return (
      <FileMessageCard
        fileId={fileInfo.fileId}
        fileName={fileInfo.fileName}
        mimeType={fileInfo.mimeType}
        fileSize={fileInfo.fileSize}
        isMe={isMe}
      />
    );
  }

  const parts = body.split(/(@\S+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const isMeMentioned = part === `@${myDisplayName}`;
          return (
            <span
              key={i}
              className="rounded px-0.5 font-semibold"
              style={{
                background: isMe ? "rgba(255,255,255,0.25)" : isMeMentioned ? "rgba(255,107,53,0.15)" : "rgba(11,61,145,0.1)",
                color: isMe ? "#fff" : isMeMentioned ? "#FF6B35" : "var(--color-primary)",
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function GroupChat({
  groupId,
  groupName,
  currentUserId,
  initialMessages,
  members,
  myDisplayName,
  pendingMention,
  onMentionConsumed,
  onFileUploaded,
}: {
  groupId: string;
  groupName: string;
  currentUserId: string;
  initialMessages: Array<{ id: string; group_id: string; user_id: string; body: string; created_at: string }>;
  members: Member[];
  myDisplayName: string;
  pendingMention?: string | null;
  onMentionConsumed?: () => void;
  onFileUploaded?: (file: GroupFile) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(() =>
    buildMessages(initialMessages, members, currentUserId, myDisplayName)
  );
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const { error: toastError } = useToast();
  const { addMention } = useMentions();

  const [mentionQuery, setMentionQuery] = useState<{ start: number; query: string } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const mentionMembers = mentionQuery
    ? members
        .filter((m) => m.user_id !== currentUserId && m.users?.display_name)
        .filter((m) =>
          !mentionQuery.query ||
          m.users!.display_name!.toLowerCase().includes(mentionQuery.query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const filtered = prev.filter(
              (m) => !(m.id.startsWith("opt-") && m.user_id === row.user_id && m.body === row.body)
            );
            return [
              ...filtered,
              {
                ...row,
                display_name: resolveName(row.user_id, members, currentUserId, myDisplayName),
              },
            ];
          });
          if (row.user_id !== currentUserId && myDisplayName && row.body.includes(`@${myDisplayName}`)) {
            addMention(groupId, groupName);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, members]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery?.query]);

  useEffect(() => {
    if (!pendingMention) return;
    const mention = `@${pendingMention} `;
    setBody((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${mention}` : mention;
    });
    onMentionConsumed?.();
    setTimeout(() => {
      inputRef.current?.focus();
      const len = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(len, len);
    }, 0);
  }, [pendingMention]);

  function validateFile(file: File): string | null {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "JPEG・PNG・GIF・WebP・PDFのみ送信できます";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "ファイルサイズは50MB以下にしてください";
    }
    return null;
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(e: React.DragEvent) {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toastError(err); return; }
    setPendingFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toastError(err); return; }
    setPendingFile(file);
    e.target.value = "";
  }

  async function handleFileConfirm() {
    if (!pendingFile) return;
    setFileUploading(true);
    try {
      const supabase = createClient();
      const fileId = crypto.randomUUID();
      const ext = pendingFile.name.split(".").pop() ?? "";
      const storagePath = `${groupId}/${fileId}${ext ? `.${ext}` : ""}`;

      // ブラウザから直接 Supabase Storage にアップロード
      const { error: uploadError } = await supabase.storage
        .from("group-files")
        .upload(storagePath, pendingFile, { contentType: pendingFile.type });

      if (uploadError) {
        toastError("アップロードに失敗しました。Supabase の設定を確認してください。");
        return;
      }

      // メタデータだけサーバーアクションに渡す（ファイルバイトなし）
      const result = await recordGroupFile(groupId, {
        fileId,
        storagePath,
        fileName: pendingFile.name,
        mimeType: pendingFile.type,
        fileSize: pendingFile.size,
      });

      if ("error" in result) {
        toastError(result.error ?? "記録に失敗しました");
        return;
      }

      setPendingFile(null);

      // チャット欄に即表示（楽観的メッセージ）
      const fileBody = `__file__:${fileId}:${pendingFile.type}:${pendingFile.size}:${encodeURIComponent(pendingFile.name)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `opt-${fileId}`,
          group_id: groupId,
          user_id: currentUserId,
          body: fileBody,
          created_at: new Date().toISOString(),
          display_name: myDisplayName,
        },
      ]);

      onFileUploaded?.({
        id: fileId,
        original_name: pendingFile.name,
        mime_type: pendingFile.type,
        file_size: pendingFile.size,
        created_at: new Date().toISOString(),
        user_id: currentUserId,
      });
    } catch {
      toastError("アップロードに失敗しました。もう一度お試しください。");
    } finally {
      setFileUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);
    const cursor = e.target.selectionStart ?? val.length;
    const trigger = getMentionTrigger(val, cursor);
    setMentionQuery(trigger);
  }

  function selectMention(member: Member) {
    if (!mentionQuery || !inputRef.current) return;
    const name = member.users?.display_name ?? "";
    const before = body.slice(0, mentionQuery.start);
    const after = body.slice(inputRef.current.selectionStart ?? body.length);
    const newBody = `${before}@${name} ${after}`;
    setBody(newBody);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = before.length + name.length + 2;
      inputRef.current?.setSelectionRange(pos, pos);
      inputRef.current?.focus();
    });
  }

  function send() {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      group_id: groupId,
      user_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      display_name: myDisplayName,
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    setMentionQuery(null);

    startTransition(async () => {
      const result = await sendGroupMessage(groupId, trimmed);
      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setBody(trimmed);
        toastError("送信に失敗しました。もう一度お試しください。");
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionMembers.length > 0 && mentionQuery) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionMembers.length) % mentionMembers.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && mentionMembers.length > 0)) {
        e.preventDefault();
        selectMention(mentionMembers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {pendingFile && (
        <FileConfirmModal
          file={pendingFile}
          onConfirm={handleFileConfirm}
          onCancel={() => { if (!fileUploading) setPendingFile(null); }}
          uploading={fileUploading}
        />
      )}

      <div
        className="flex flex-col h-full min-h-0 relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl"
            style={{ background: "rgba(11,61,145,0.08)", border: "2px dashed var(--color-primary)", backdropFilter: "blur(2px)", pointerEvents: "none" }}
          >
            <Paperclip size={32} style={{ color: "var(--color-primary)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              ファイルをドロップして送信
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              JPEG・PNG・GIF・WebP・PDF（50MBまで）
            </p>
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                まだメッセージがありません
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
                最初のメッセージを送りましょう
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.user_id === currentUserId;
              const prevMsg = messages[i - 1];
              const showName = !isMe && prevMsg?.user_id !== msg.user_id;
              const time = new Date(msg.created_at).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isFile = msg.body.startsWith("__file__:");

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${i > 0 ? "mt-1" : ""}`}
                >
                  {showName && (
                    <p className="mb-0.5 ml-1 text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                      {msg.display_name}
                    </p>
                  )}
                  <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    {isFile ? (
                      <MessageBody body={msg.body} isMe={isMe} myDisplayName={myDisplayName} />
                    ) : (
                      <div
                        className="max-w-[72vw] sm:max-w-xs break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
                        style={
                          isMe
                            ? { background: "var(--color-primary)", color: "#fff" }
                            : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }
                        }
                      >
                        <MessageBody body={msg.body} isMe={isMe} myDisplayName={myDisplayName} />
                      </div>
                    )}
                    <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
                      {time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="relative shrink-0 px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {/* @mention autocomplete popup */}
          {mentionMembers.length > 0 && mentionQuery && (
            <div
              className="absolute bottom-full left-4 right-4 mb-1 overflow-hidden rounded-xl shadow-lg"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
            >
              <div
                className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-subtle)", borderBottom: "1px solid var(--color-border)" }}
              >
                <AtSign size={9} className="inline mr-1" />
                メンションするメンバーを選択
              </div>
              {mentionMembers.map((m, idx) => (
                <button
                  key={m.user_id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectMention(m); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition"
                  style={{
                    background: idx === mentionIndex ? "var(--color-primary-soft)" : "transparent",
                    color: idx === mentionIndex ? "var(--color-primary)" : "var(--color-text)",
                  }}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {(m.users?.display_name ?? "?")[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium">{m.users?.display_name}</span>
                  {m.role === "owner" && (
                    <span className="ml-auto text-[10px]" style={{ color: "var(--color-warning)" }}>オーナー</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-2xl px-3 py-2"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            {/* File attachment button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:opacity-80"
              style={{ color: "var(--color-text-muted)" }}
              title="ファイルを添付"
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={inputRef}
              value={body}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              placeholder="メッセージを入力… @ でメンション"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{
                color: "var(--color-text)",
                maxHeight: "120px",
                lineHeight: "1.5",
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={!body.trim() || isPending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="mt-1.5 text-right text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
            Shift+Enter で改行 · @ でメンション · クリップで添付
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    </>
  );
}
