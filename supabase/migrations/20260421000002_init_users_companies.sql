-- ===================================================================
-- TORU v0.1: users / companies / company_member / subscriptions
-- ===================================================================

-- -------------------------------------------------------------------
-- users: Supabase Auth (auth.users) の拡張プロフィール
-- -------------------------------------------------------------------
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  display_name text,
  plan_type    text not null default 'individual'
                 check (plan_type in ('individual', 'company')),
  industry_tag text,  -- 配管/電気/ダクト/建築/設備/土木/その他（アプリ側で制御）
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Auth でサインアップされたら public.users に自動挿入
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------
-- companies
-- -------------------------------------------------------------------
create table public.companies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  plan               text not null default 'individual'
                       check (plan in ('individual', 'team_5', 'team_10', 'team_unlimited')),
  industry_tag       text,
  stripe_customer_id text,
  created_by         uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------
-- company_member: 会社とユーザーの連関
-- -------------------------------------------------------------------
create table public.company_member (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'member'
               check (role in ('owner', 'admin', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index idx_company_member_user on public.company_member(user_id);

-- -------------------------------------------------------------------
-- subscriptions
-- -------------------------------------------------------------------
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  plan                    text not null
                            check (plan in ('individual', 'team_5', 'team_10', 'team_unlimited')),
  status                  text not null default 'trialing'
                            check (status in ('active', 'past_due', 'cancelled', 'trialing')),
  provider                text check (provider in ('stripe', 'revenuecat', 'invoice')),
  provider_subscription_id text,
  monthly_amount_jpy      int,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index idx_subscriptions_company on public.subscriptions(company_id);

-- -------------------------------------------------------------------
-- ヘルパー関数: 現在ユーザーが所属する company_id の一覧
-- RLSポリシーから参照する
-- -------------------------------------------------------------------
create or replace function public.current_user_company_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select company_id from public.company_member where user_id = auth.uid()
$$;
