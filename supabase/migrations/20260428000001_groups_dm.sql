-- ===================================================================
-- TORU v0.2/v0.3: グループ + DM テーブル
-- ===================================================================

-- ─── project_groups ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_groups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code          text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text,
  trust_level         text NOT NULL DEFAULT 'mixed'
                        CHECK (trust_level IN ('trusted', 'mixed')),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_by_company  uuid REFERENCES companies(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

-- ─── project_group_members ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_group_members (
  group_id   uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  role       text NOT NULL DEFAULT 'member'
               CHECK (role IN ('owner', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- ─── group_invitations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  invitee_email   text,
  invitee_user_id uuid REFERENCES auth.users(id),
  invitation_type text NOT NULL
                    CHECK (invitation_type IN ('link', 'id_input', 'email')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  token           text UNIQUE,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  responded_at    timestamptz
);

-- ─── direct_messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id    uuid NOT NULL REFERENCES auth.users(id),
  to_user_id      uuid NOT NULL REFERENCES auth.users(id),
  group_id        uuid REFERENCES project_groups(id),
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  attachment_path text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

-- ─── RLS 有効化 ───────────────────────────────────────────────────
ALTER TABLE project_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages       ENABLE ROW LEVEL SECURITY;

-- project_groups: メンバーのみ閲覧
CREATE POLICY "groups_select_member" ON project_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_group_members pgm
      WHERE pgm.group_id = project_groups.id AND pgm.user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert_auth" ON project_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "groups_update_owner" ON project_groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "groups_delete_owner" ON project_groups FOR DELETE
  USING (created_by = auth.uid());

-- project_group_members: 同グループメンバー間で閲覧可
CREATE POLICY "pgm_select_cogroup" ON project_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_group_members m
      WHERE m.group_id = project_group_members.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "pgm_insert_auth" ON project_group_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pgm_delete_self_or_owner" ON project_group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_group_members m
      WHERE m.group_id = project_group_members.group_id
        AND m.user_id = auth.uid() AND m.role = 'owner'
    )
  );

-- group_invitations: 招待者・被招待者・グループ owner が閲覧可
CREATE POLICY "inv_select_stakeholder" ON group_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR invitee_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_group_members m
      WHERE m.group_id = group_invitations.group_id
        AND m.user_id = auth.uid() AND m.role = 'owner'
    )
  );

CREATE POLICY "inv_insert_auth" ON group_invitations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND invited_by = auth.uid());

CREATE POLICY "inv_update_stakeholder" ON group_invitations FOR UPDATE
  USING (invited_by = auth.uid() OR invitee_user_id = auth.uid());

-- direct_messages: 送受信者のみ閲覧・更新
CREATE POLICY "dm_select_parties" ON direct_messages FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "dm_insert_from_self" ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND from_user_id = auth.uid());

CREATE POLICY "dm_update_read_at" ON direct_messages FOR UPDATE
  USING (to_user_id = auth.uid());

-- ─── users テーブル: グループ仲間の表示名を取得できるよう拡張 ──────
-- グループメンバー・DM相手の display_name が必要なため
CREATE POLICY "users_select_group_member" ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_group_members a
      JOIN project_group_members b ON a.group_id = b.group_id
      WHERE a.user_id = auth.uid() AND b.user_id = public.users.id
    )
    OR EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE (dm.from_user_id = auth.uid() AND dm.to_user_id = public.users.id)
         OR (dm.to_user_id = auth.uid() AND dm.from_user_id = public.users.id)
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pgm_user_id   ON project_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pgm_group_id  ON project_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_dm_to_user    ON direct_messages(to_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_dm_created    ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_pair       ON direct_messages(from_user_id, to_user_id, created_at DESC);

-- ─── Realtime 有効化 ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE project_group_members;
