-- ===================================================================
-- TORU v0.1: 単価マスタ（公開 / 会社別）
-- ===================================================================

-- -------------------------------------------------------------------
-- public_unit_price_master: 公開単価データ（全ユーザー read-only）
-- 運営側が定期的にメンテ、ユーザーは自社マスタへコピーして使う
-- -------------------------------------------------------------------
create table public.public_unit_price_master (
  id            uuid primary key default gen_random_uuid(),
  material_name text not null,
  unit          text not null,
  unit_price    numeric(12,2) not null,
  category      text,
  source_name   text not null,        -- 例: 国交省標準単価2026
  source_url    text,
  published_at  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger public_unit_price_master_updated_at
  before update on public.public_unit_price_master
  for each row execute function public.set_updated_at();

create index idx_public_unit_price_material on public.public_unit_price_master(material_name);
create index idx_public_unit_price_category on public.public_unit_price_master(category);

-- -------------------------------------------------------------------
-- unit_price_master: 会社別の単価マスタ（会社内クローズド）
-- -------------------------------------------------------------------
create table public.unit_price_master (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  material_name    text not null,
  unit             text not null,
  unit_price       numeric(12,2) not null,
  category         text,
  memo             text,
  source_master_id uuid references public.public_unit_price_master(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create trigger unit_price_master_updated_at
  before update on public.unit_price_master
  for each row execute function public.set_updated_at();

create index idx_unit_price_master_company  on public.unit_price_master(company_id);
create index idx_unit_price_master_material on public.unit_price_master(material_name);
create index idx_unit_price_master_category on public.unit_price_master(category);
