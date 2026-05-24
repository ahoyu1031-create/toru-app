import Link from "next/link";
import { Gift, AlertCircle } from "lucide-react";
import {
  getTrialStatus,
  TRIAL_DRAWING_LIMIT,
  TRIAL_DURATION_DAYS,
} from "@/lib/plan";

type Props = {
  company: {
    plan: string | null;
    trial_started_at: string | null;
    trial_drawings_used: number | null;
  };
};

/**
 * トライアル状態のユーザーに「残り何回/何日」を常時表示するバナー。
 * - plan != null（有料 or grandfathered）: 何も表示しない
 * - active: 青系。残3回以下 or 残2日以下で amber に切替
 * - ended: 赤系 + プラン選択誘導
 */
export function TrialBanner({ company }: Props) {
  // 有料プランや is_unlimited 相当（grandfathered）は表示不要
  if (company.plan !== null) return null;

  const status = getTrialStatus(company);

  // active: 残数バー
  if (status.active) {
    const warn = status.drawingsRemaining <= 3 || status.daysRemaining <= 2;
    const palette = warn
      ? {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-900",
          icon: "text-amber-600",
          link: "text-amber-800 hover:text-amber-900",
        }
      : {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-900",
          icon: "text-blue-600",
          link: "text-blue-800 hover:text-blue-900",
        };

    return (
      <div
        className={`rounded-xl border ${palette.bg} ${palette.border} px-4 py-3 flex items-center justify-between gap-3`}
      >
        <div className={`flex items-center gap-2 ${palette.text}`}>
          <Gift size={18} className={palette.icon} />
          <span className="text-sm font-medium">
            無料体験中: 図面解析 残り
            <span className="font-bold mx-1">{status.drawingsRemaining}</span>
            回 / あと
            <span className="font-bold mx-1">{status.daysRemaining}</span>日
          </span>
        </div>
        <Link
          href="/settings/plan"
          className={`text-sm font-medium underline ${palette.link} whitespace-nowrap`}
        >
          プランを見る →
        </Link>
      </div>
    );
  }

  // ended: プラン選択誘導
  const reasonText =
    status.reason === "limit_reached"
      ? `無料体験の解析回数（${TRIAL_DRAWING_LIMIT}回）を使い切りました`
      : `無料体験期間（${TRIAL_DURATION_DAYS}日間）が終了しました`;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-red-900">
        <AlertCircle size={18} className="text-red-600" />
        <span className="text-sm font-medium">
          {reasonText} — 引き続きご利用にはプラン選択が必要です
        </span>
      </div>
      <Link
        href="/settings/plan"
        className="rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 whitespace-nowrap"
      >
        プランを選ぶ
      </Link>
    </div>
  );
}
