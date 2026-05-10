-- ================================================================
-- TORU: 未適用マイグレーション 完全版
-- Supabase Dashboard > SQL Editor (新規タブ) に貼り付けて実行
-- 冪等設計 — 何度実行しても安全
-- ================================================================


-- ================================================================
-- A. project_groups / project_group_members / group_invitations
--    / direct_messages
-- ================================================================

CREATE TABLE IF NOT EXISTS public.project_groups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code          text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text,
  trust_level         text NOT NULL DEFAULT 'mixed'
                        CHECK (trust_level IN ('trusted', 'mixed')),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_by_company  uuid REFERENCES public.companies(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE TABLE IF NOT EXISTS public.project_group_members (
  group_id   uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid REFERENCES public.companies(id),
  role       text NOT NULL DEFAULT 'member'
               CHECK (role IN ('owner', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  invitee_email   text,
  invitee_user_id uuid REFERENCES auth.users(id),
  invitation_type text NOT NULL CHECK (invitation_type IN ('link', 'id_input', 'email')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  token           text UNIQUE,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  responded_at    timestamptz
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id    uuid NOT NULL REFERENCES auth.users(id),
  to_user_id      uuid NOT NULL REFERENCES auth.users(id),
  group_id        uuid REFERENCES public.project_groups(id),
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  attachment_path text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

ALTER TABLE public.project_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "groups_select_member" ON public.project_groups FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.project_group_members pgm
                   WHERE pgm.group_id = project_groups.id AND pgm.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "groups_insert_auth" ON public.project_groups FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "groups_update_owner" ON public.project_groups FOR UPDATE
    USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "groups_delete_owner" ON public.project_groups FOR DELETE
    USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pgm_select_cogroup" ON public.project_group_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.project_group_members m
                   WHERE m.group_id = project_group_members.group_id AND m.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pgm_insert_auth" ON public.project_group_members FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pgm_delete_self_or_owner" ON public.project_group_members FOR DELETE
    USING (user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.project_group_members m
                 WHERE m.group_id = project_group_members.group_id
                   AND m.user_id = auth.uid() AND m.role = 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "inv_select_stakeholder" ON public.group_invitations FOR SELECT
    USING (invited_by = auth.uid() OR invitee_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.project_group_members m
                 WHERE m.group_id = group_invitations.group_id
                   AND m.user_id = auth.uid() AND m.role = 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "inv_insert_auth" ON public.group_invitations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND invited_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "inv_update_stakeholder" ON public.group_invitations FOR UPDATE
    USING (invited_by = auth.uid() OR invitee_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_select_parties" ON public.direct_messages FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_insert_from_self" ON public.direct_messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND from_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_update_read_at" ON public.direct_messages FOR UPDATE
    USING (to_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users テーブルにグループメンバー参照ポリシーを追加
DO $$ BEGIN
  CREATE POLICY "users_select_group_member" ON public.users FOR SELECT
    USING (
      id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.project_group_members a
                 JOIN public.project_group_members b ON a.group_id = b.group_id
                 WHERE a.user_id = auth.uid() AND b.user_id = public.users.id)
      OR EXISTS (SELECT 1 FROM public.direct_messages dm
                 WHERE (dm.from_user_id = auth.uid() AND dm.to_user_id = public.users.id)
                    OR (dm.to_user_id = auth.uid() AND dm.from_user_id = public.users.id))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_pgm_user_id  ON public.project_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pgm_group_id ON public.project_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_dm_to_user   ON public.direct_messages(to_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_dm_created   ON public.direct_messages(created_at DESC);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_group_members;
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- B. drawing_analyses
-- ================================================================

CREATE TABLE IF NOT EXISTS public.drawing_analyses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name   text NOT NULL,
  trade       text NOT NULL,
  mode        text NOT NULL,
  result      jsonb,
  all_result  jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

ALTER TABLE public.drawing_analyses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own analyses"
    ON public.drawing_analyses FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS drawing_analyses_user_id_idx
  ON public.drawing_analyses (user_id, created_at DESC);


-- ================================================================
-- C. group_messages
-- ================================================================

CREATE TABLE IF NOT EXISTS public.group_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "gm_select_member" ON public.group_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.project_group_members pgm
                   WHERE pgm.group_id = group_messages.group_id AND pgm.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "gm_insert_member" ON public.group_messages FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND user_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.project_group_members pgm
                  WHERE pgm.group_id = group_messages.group_id AND pgm.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "gm_delete_own" ON public.group_messages FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_gm_group_created ON public.group_messages (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_user          ON public.group_messages (user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- D. 開発用: plan を team_unlimited に統一
-- ================================================================

UPDATE public.companies
SET plan = 'team_unlimited'
WHERE plan = 'individual' OR plan IS NULL;


-- ================================================================
-- 確認クエリ — この4テーブルが返れば成功
-- ================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'project_groups', 'project_group_members',
    'drawing_analyses', 'group_messages'
  )
ORDER BY table_name;
