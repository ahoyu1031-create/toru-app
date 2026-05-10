"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveDrawingAnalysis } from "@/app/(app)/drawings/actions";

export type Mode = "all" | "materials" | "construction_notes" | "coordination" | "communication";
export type NonAllMode = Exclude<Mode, "all">;
export type MaterialItem = { material_name: string; quantity: number; unit: string };
export type Result =
  | { type: "materials"; items: MaterialItem[] }
  | { type: "list"; items: string[] };
export type AllResult = {
  materials: Result | null;
  construction_notes: Result | null;
  coordination: Result | null;
  communication: Result | null;
};

export const ALL_SPECIFIC_MODES: NonAllMode[] = [
  "materials",
  "construction_notes",
  "coordination",
  "communication",
];

interface AnalysisState {
  status: "idle" | "uploading" | "analyzing" | "done" | "error";
  fileName: string | null;
  selectedModes: NonAllMode[];
  trade: string;
  allResult: AllResult | null;
  analysisId: string | null;
  error: string | null;
  hasNotification: boolean;
  betaComplete: boolean;
  betaBonusUsed: boolean;
}

interface AnalysisCtx {
  state: AnalysisState;
  startAnalysis: (file: File, modes: NonAllMode[], trade: string) => Promise<void>;
  clearResult: () => void;
  markRead: () => void;
}

const defaultState: AnalysisState = {
  status: "idle",
  fileName: null,
  selectedModes: [],
  trade: "給排水衛生設備",
  allResult: null,
  analysisId: null,
  error: null,
  hasNotification: false,
  betaComplete: false,
  betaBonusUsed: false,
};

const AnalysisContext = createContext<AnalysisCtx>({
  state: defaultState,
  startAnalysis: async () => {},
  clearResult: () => {},
  markRead: () => {},
});

async function uploadToStorage(file: File): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("drawings").upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`アップロード失敗: ${error.message}`);
  return path;
}

async function fetchMode(storagePath: string, m: NonAllMode, trade: string): Promise<Result> {
  const res = await fetch("/api/analyze-drawing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, mode: m, trade }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error ?? "解析に失敗しました");
    if (json.betaComplete) (err as Error & { betaComplete: boolean; bonusUsed?: boolean }).betaComplete = true;
  if (json.bonusUsed) (err as Error & { betaComplete: boolean; bonusUsed?: boolean }).bonusUsed = true;
    throw err;
  }
  return json as Result;
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisState>(defaultState);

  const startAnalysis = useCallback(async (file: File, modes: NonAllMode[], trade: string) => {
    setState({
      ...defaultState,
      status: "uploading",
      fileName: file.name,
      selectedModes: modes,
      trade,
    });

    try {
      const storagePath = await uploadToStorage(file);
      setState((s) => ({ ...s, status: "analyzing" }));

      // 選択されたモードのみ並列実行（1つ失敗しても他は継続）
      const settled = await Promise.allSettled(modes.map((m) => fetchMode(storagePath, m, trade)));

      // AllResult を構築（失敗したモードは null のまま）
      const allResult: AllResult = {
        materials: null,
        construction_notes: null,
        coordination: null,
        communication: null,
      };
      const failedModes: string[] = [];
      modes.forEach((m, i) => {
        const r = settled[i];
        if (r.status === "fulfilled") {
          allResult[m] = r.value;
        } else {
          failedModes.push(m);
          console.error(`[analysis-context] mode ${m} failed:`, r.reason);
        }
      });

      // 全モードが失敗した場合はエラーへ
      const successCount = modes.length - failedModes.length;
      if (successCount === 0) {
        const firstError = settled[0].status === "rejected" ? settled[0].reason : null;
        throw firstError instanceof Error ? firstError : new Error("すべての解析に失敗しました");
      }

      // DB 保存用モード文字列（全選択なら "all"）
      const succeededModes = modes.filter((_, i) => settled[i].status === "fulfilled");
      const modeStr = succeededModes.length === ALL_SPECIFIC_MODES.length ? "all" : succeededModes.join(",");

      const saved = await saveDrawingAnalysis({ fileName: file.name, trade, mode: modeStr, allResult });
      const savedId = "id" in saved ? saved.id : null;
      if ("error" in saved) {
        console.error("[analysis-context] save failed:", saved.error);
      }

      const partialWarning = failedModes.length > 0
        ? `（${failedModes.length}項目の解析に失敗しました）`
        : null;

      setState((s) => ({
        ...s,
        status: "done",
        allResult,
        analysisId: savedId,
        hasNotification: true,
        error: partialWarning,
      }));
    } catch (e) {
      const err2 = e as Error & { betaComplete?: boolean; bonusUsed?: boolean };
      const betaComplete = e instanceof Error && !!err2.betaComplete;
      const betaBonusUsed = e instanceof Error && !!err2.bonusUsed;
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : "通信エラーが発生しました",
        hasNotification: true,
        betaComplete,
        betaBonusUsed,
      }));
    }
  }, []);

  const clearResult = useCallback(() => setState(defaultState), []);
  const markRead = useCallback(() => setState((s) => ({ ...s, hasNotification: false })), []);

  return (
    <AnalysisContext.Provider value={{ state, startAnalysis, clearResult, markRead }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
