/**
 * ユーザーの特権フラグ管理。
 *
 * - is_unlimited: 開発者専用フラグ（ahoyu1031）。UI で「developer / 無制限」表示。
 * - is_alpha_tester: アルファテスター承認フラグ。UI で「アルファテスター」表示。
 *
 * どちらかが true なら API 側の trial/plan 制限を全てスキップする。
 */

export type UserFlags = {
  is_unlimited: boolean | null | undefined;
  is_alpha_tester: boolean | null | undefined;
};

/** 課金/枠制限をバイパスすべきか（API 側の判定用） */
export function isUnlimitedAccess(flags: UserFlags | null | undefined): boolean {
  if (!flags) return false;
  return !!flags.is_unlimited || !!flags.is_alpha_tester;
}

/** UI 表示用ラベル ("developer" / "アルファテスター" / null) */
export function getUserBadge(
  flags: UserFlags | null | undefined
): "developer" | "alpha" | null {
  if (!flags) return null;
  if (flags.is_unlimited) return "developer";
  if (flags.is_alpha_tester) return "alpha";
  return null;
}
