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
      success("プランを変更しました。反映まで少し時間がかかる場合があります。");
      router.replace("/settings/plan");
    } else if (params.get("canceled") === "1") {
      shown.current = true;
      info("プラン変更をキャンセルしました。");
      router.replace("/settings/plan");
    }
  }, [params, router, success, info]);

  return null;
}
