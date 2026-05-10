"use client";

import { useFormStatus } from "react-dom";
import { Building2, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

const inputClass = [
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition",
  "focus:ring-2 focus:ring-offset-0",
].join(" ");

const inputStyle = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-60"
      style={{ background: "var(--color-primary)" }}
    >
      {pending ? "設定中..." : "設定を完了して図面解析を始める"}
      {!pending && <ArrowRight size={18} />}
    </button>
  );
}

export function OnboardingForm({ defaultDisplayName, action }: {
  defaultDisplayName: string;
  action: (fd: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-6">

      {/* Company section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={16} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            会社情報
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              会社名 <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              name="company_name"
              type="text"
              required
              placeholder="株式会社山田建設"
              maxLength={80}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              電話番号（任意）
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
              <input
                name="tel"
                type="tel"
                placeholder="090-0000-0000"
                className={inputClass + " pl-9"}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: "var(--color-border)" }} />

      {/* Personal section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <User size={16} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            担当者情報
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              担当者名（PDF記載用・任意）
            </label>
            <input
              name="contact_name"
              type="text"
              placeholder="山田 太郎"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              グループでの表示名 <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              name="display_name"
              type="text"
              required
              defaultValue={defaultDisplayName}
              placeholder="山田 太郎"
              className={inputClass}
              style={inputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              グループチャットで相手に表示される名前です
            </p>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
          設定後にできること
        </p>
        {[
          "会社名入りの見積書PDFをすぐに出力",
          "図面をアップロードして材料を自動拾い出し",
          "グループにチームを招待してチャット",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 py-0.5">
            <CheckCircle2 size={12} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item}</span>
          </div>
        ))}
      </div>

      <SubmitButton />

    </form>
  );
}
