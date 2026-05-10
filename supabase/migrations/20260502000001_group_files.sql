-- ===================================================================
-- group_files: グループファイル共有テーブル + Storage バケット
-- ===================================================================

-- テーブル作成
create table if not exists public.group_files (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.project_groups(id) on delete cascade,
  user_id uuid not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists group_files_group_id_created_idx
  on public.group_files(group_id, created_at desc);

-- RLS 有効化
alter table public.group_files enable row level security;

-- メンバーのみ閲覧可能
create policy "group_files_select" on public.group_files
  for select to authenticated
  using (
    exists (
      select 1 from public.project_group_members pgm
      where pgm.group_id = group_files.group_id
        and pgm.user_id = auth.uid()
    )
  );

-- メンバーのみ自分のファイルを追加可能
create policy "group_files_insert" on public.group_files
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_group_members pgm
      where pgm.group_id = group_files.group_id
        and pgm.user_id = auth.uid()
    )
  );

-- ===================================================================
-- Storage バケット（group-files）
-- ===================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'group-files',
  'group-files',
  false,
  52428800,  -- 50MB
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;
