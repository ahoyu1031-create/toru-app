-- ================================================================
-- group_join_requests テーブル新規作成
-- ================================================================

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- 申請者本人は自分の申請を参照できる
DO $$ BEGIN
  CREATE POLICY "gjr_select_own" ON public.group_join_requests FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- オーナーは自グループの申請を参照できる
DO $$ BEGIN
  CREATE POLICY "gjr_select_owner" ON public.group_join_requests FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_group_members m
      WHERE m.group_id = group_join_requests.group_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 申請者本人が挿入できる（未メンバー）
DO $$ BEGIN
  CREATE POLICY "gjr_insert_applicant" ON public.group_join_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_gjr_group_status
  ON public.group_join_requests(group_id, status);

CREATE INDEX IF NOT EXISTS idx_gjr_user
  ON public.group_join_requests(user_id, status);
