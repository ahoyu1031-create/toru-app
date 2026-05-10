"use client";

import { useActionState } from "react";
import { updateCompanyInfo } from "./actions";

type Company = {
  name: string;
  postal_code?: string | null;
  address?: string | null;
  tel?: string | null;
  fax?: string | null;
  contact_name?: string | null;
};

type ActionResult = { ok: true } | { ok: false; error: string };

export function CompanyForm({ company }: { company: Company }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateCompanyInfo,
    null,
  );

  const inputClass =
    "mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none";
  const labelClass = "block text-sm font-medium";

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>
            会社名 <span className="text-[color:var(--color-danger)]">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={company.name}
            placeholder="株式会社○○"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>郵便番号</label>
          <input
            name="postal_code"
            type="text"
            defaultValue={company.postal_code ?? ""}
            placeholder="〒000-0000"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>住所</label>
          <input
            name="address"
            type="text"
            defaultValue={company.address ?? ""}
            placeholder="○○県○○市..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>TEL</label>
          <input
            name="tel"
            type="text"
            defaultValue={company.tel ?? ""}
            placeholder="090-0000-0000"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>FAX</label>
          <input
            name="fax"
            type="text"
            defaultValue={company.fax ?? ""}
            placeholder="0765-00-0000"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>担当者名（見積書に表示）</label>
          <input
            name="contact_name"
            type="text"
            defaultValue={company.contact_name ?? ""}
            placeholder="山田 太郎"
            className={inputClass}
          />
        </div>
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-[color:var(--color-success)]">
          保存しました
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-8 text-base font-semibold text-white shadow-sm hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
