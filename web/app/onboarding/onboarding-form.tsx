"use client";

import { useFormStatus } from "react-dom";
import { Building2, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bp-cta flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-60"
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
          <Building2 size={16} style={{ color: "#0B3D91" }} />
          <h2 className="bp-code text-xs font-bold" style={{ color: "rgba(11,61,145,0.7)" }}>
            COMPANY / 会社情報
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="bp-label">
              会社名 <span style={{ color: "#FF6B35" }}>*</span>
            </label>
            <input
              name="company_name"
              type="text"
              required
              placeholder="株式会社山田建設"
              maxLength={80}
              className="bp-input"
            />
          </div>

          <div>
            <label className="bp-label">電話番号（任意）</label>
            <div className="relative">
              <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(11,61,145,0.5)" }} />
              <input
                name="tel"
                type="tel"
                placeholder="090-0000-0000"
                className="bp-input pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: "rgba(11,61,145,0.25)" }} />

      {/* Personal section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <User size={16} style={{ color: "#0B3D91" }} />
          <h2 className="bp-code text-xs font-bold" style={{ color: "rgba(11,61,145,0.7)" }}>
            CONTACT / 担当者情報
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="bp-label">担当者名（PDF記載用・任意）</label>
            <input
              name="contact_name"
              type="text"
              placeholder="山田 太郎"
              className="bp-input"
            />
          </div>

          <div>
            <label className="bp-label">
              グループでの表示名 <span style={{ color: "#FF6B35" }}>*</span>
            </label>
            <input
              name="display_name"
              type="text"
              required
              defaultValue={defaultDisplayName}
              placeholder="山田 太郎"
              className="bp-input"
            />
            <p className="mt-1.5 text-xs" style={{ color: "rgba(11,61,145,0.55)" }}>
              グループチャットで相手に表示される名前です
            </p>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="bp-alert bp-alert-ok">
        <p className="mb-2 text-xs font-bold">設定後にできること</p>
        {[
          "会社名入りの見積書PDFをすぐに出力",
          "図面をアップロードして材料を自動拾い出し",
          "グループにチームを招待してチャット",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 py-0.5">
            <CheckCircle2 size={12} style={{ color: "#0B3D91", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "rgba(11,61,145,0.8)" }}>{item}</span>
          </div>
        ))}
      </div>

      <SubmitButton />

    </form>
  );
}
