-- グループ内チャットメッセージ
CREATE TABLE public.group_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- グループメンバーのみ読み書き可
CREATE POLICY "gm_select_member" ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_group_members pgm
      WHERE pgm.group_id = group_messages.group_id AND pgm.user_id = auth.uid()
    )
  );

CREATE POLICY "gm_insert_member" ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM project_group_members pgm
      WHERE pgm.group_id = group_messages.group_id AND pgm.user_id = auth.uid()
    )
  );

-- 自分のメッセージのみ soft delete 可
CREATE POLICY "gm_delete_own" ON public.group_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX idx_gm_group_created ON public.group_messages (group_id, created_at DESC);
CREATE INDEX idx_gm_user          ON public.group_messages (user_id);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
