-- 図面解析結果の永続化テーブル
CREATE TABLE public.drawing_analyses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name   text NOT NULL,
  trade       text NOT NULL,
  mode        text NOT NULL,
  result      jsonb,      -- single mode result
  all_result  jsonb,      -- "all" mode result
  created_at  timestamptz DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

ALTER TABLE public.drawing_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analyses"
  ON public.drawing_analyses
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX drawing_analyses_user_id_idx ON public.drawing_analyses (user_id, created_at DESC);
