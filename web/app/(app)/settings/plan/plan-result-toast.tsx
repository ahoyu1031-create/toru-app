"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-context";

export function PlanResultToast() {
  const router = useRouter();
  const params = useSearchParams();
  const { success, info } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (params.get("success") === "1") {
      shown.current = true;
      if (params.get("nochange") === "1") {
        info("既に同じプランをご利用中です。");
      } else if (params.get("updated") === "1") {
        success("プランを変更しました。今月は追加料金なし、次回請求から新料金になります。");
      } else {
        success("プランを変更しました。反映まで少し時間がかかる場合があります。");
      }
      router.replace("/settings/plan");
    } else if (params.get("canceled") === "1") {
      shown.current = true;
      info("プラン変更をキャンセルしました。");
      router.replace("/settings/plan");
    }
  }, [params, router, success, info]);

  return null;
}
