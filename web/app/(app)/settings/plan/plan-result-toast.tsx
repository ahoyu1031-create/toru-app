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
      } else if (params.get("scheduled") === "1") {
        success("ダウングレードを予約しました。次回請求日から新プランに切り替わります。");
      } else if (params.get("updated") === "1") {
        success("プランをアップグレードしました。今すぐ新機能が使えます。次回請求から新料金です。");
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
