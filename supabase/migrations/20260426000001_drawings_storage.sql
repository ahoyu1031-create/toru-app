-- ===================================================================
-- drawings: 図面PDFストレージバケット + RLS
-- ===================================================================

-- バケット作成（非公開）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'drawings',
  'drawings',
  false,
  52428800,  -- 50MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- ポリシーを一旦削除して再作成（冪等性のため）
drop policy if exists "drawings_insert" on storage.objects;
drop policy if exists "drawings_select" on storage.objects;
drop policy if exists "drawings_delete" on storage.objects;

-- アップロード: 自分のフォルダ（user_id/）にのみ許可
create policy "drawings_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'drawings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 読み取り: 自分のフォルダのみ
create policy "drawings_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'drawings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 削除: 自分のフォルダのみ
create policy "drawings_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'drawings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
