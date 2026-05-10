-- ===================================================================
-- TORU v0.1: 見積書 / 見積書明細
-- ===================================================================

-- -------------------------------------------------------------------
-- quotes: 見積書
-- -------------------------------------------------------------------
create table public.quotes (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  project_name     text,
  client_name      text,
  quote_date       date,
  total_amount     numeric(14,2) not null default 0,
  status           text not null default 'draft'
                     check (status in ('draft', 'issued', 'accepted', 'rejected')),
  pdf_storage_path text,
  created_by       uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

create index idx_quotes_company on public.quotes(company_id);
create index idx_quotes_status  on public.quotes(status);
create index idx_quotes_date    on public.quotes(quote_date desc);

-- -------------------------------------------------------------------
-- quote_items: 見積書明細
-- subtotal は quantity × unit_price の STORED generated column
-- -------------------------------------------------------------------
create table public.quote_items (
  id                   uuid primary key default gen_random_uuid(),
  quote_id             uuid not null references public.quotes(id) on delete cascade,
  material_name        text not null,
  unit                 text,
  quantity             numeric(12,2) not null,
  unit_price           numeric(12,2) not null,
  subtotal             numeric(14,2) generated always as (quantity * unit_price) stored,
  unit_price_master_id uuid references public.unit_price_master(id) on delete set null,
  sort_order           int
);

create index idx_quote_items_quote on public.quote_items(quote_id);
create index idx_quote_items_sort  on public.quote_items(quote_id, sort_order);
