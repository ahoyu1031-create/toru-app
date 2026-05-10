// 単位グループ。追加する場合はここに追記するだけ。
export const UNIT_GROUPS: Record<string, string[]> = {
  長さ: ["m", "cm", "mm"],
  "面積・体積": ["m²", "m³"],
  個数: ["個", "本", "枚", "組", "セット", "式", "箇所"],
  重量: ["kg", "t"],
  その他: ["巻", "袋", "缶", "台"],
};

// 全単位のフラットリスト（ComboInput の suggestions に使用）
export const ALL_UNITS = Object.values(UNIT_GROUPS).flat();
