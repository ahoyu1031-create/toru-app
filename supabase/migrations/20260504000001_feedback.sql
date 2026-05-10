-- フィードバックテーブル
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  category text, -- 'bug' | 'feature' | 'ux' | 'other'
  body text not null,
  job_title text,        -- 職種（任意）
  company_size text,     -- 会社規模（任意）
  created_at timestamptz default now()
);

-- RLS
alter table public.feedback enable row level security;

-- 自分のフィードバックは読める
create policy "users can read own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

-- 認証済みなら投稿できる
create policy "authenticated users can insert feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);
