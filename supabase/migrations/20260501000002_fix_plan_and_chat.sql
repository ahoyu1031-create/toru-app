-- ① 既存の individual プランを全て team_unlimited に更新（開発用）
UPDATE public.companies
SET plan = 'team_unlimited'
WHERE plan = 'individual';

-- ② group_messages テーブル（まだ存在しない場合のみ作成）
CREATE TABLE IF NOT EXISTS public.group_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "gm_delete_own" ON public.group_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_gm_group_created ON public.group_messages (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_user          ON public.group_messages (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- ③ drawing_analyses テーブル（まだ存在しない場合のみ作成）
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

CREATE POLICY "Users manage own analyses"
  ON public.drawing_analyses FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS drawing_analyses_user_id_idx
  ON public.drawing_analyses (user_id, created_at DESC);
