-- ===================================================================
-- TORU v0.1 初期化: 共通拡張と共通関数
-- ===================================================================

-- UUID生成用の拡張
create extension if not exists "pgcrypto";

-- 全テーブル共通: updated_at 自動更新トリガー関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
