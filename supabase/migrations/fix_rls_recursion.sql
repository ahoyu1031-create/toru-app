-- ================================================================
-- RLS 再帰問題の修正
-- project_groups / project_group_members / group_messages の
-- SELECT ポリシーが自己参照で無限ループになる問題を解消する
--
-- 解決策: SECURITY DEFINER 関数で RLS をバイパスして
-- メンバーシップを確認する
-- ================================================================

-- ① is_member_of_group 関数を作成（RLS をバイパスして確認）
CREATE OR REPLACE FUNCTION public.is_member_of_group(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_group_members
    WHERE group_id = gid AND user_id = auth.uid()
  )
$$;

-- ② project_groups の SELECT ポリシーを差し替え
DROP POLICY IF EXISTS "groups_select_member" ON public.project_groups;
CREATE POLICY "groups_select_member" ON public.project_groups FOR SELECT
  USING (public.is_member_of_group(id));

-- ③ project_group_members の SELECT ポリシーを差し替え
DROP POLICY IF EXISTS "pgm_select_cogroup" ON public.project_group_members;
CREATE POLICY "pgm_select_cogroup" ON public.project_group_members FOR SELECT
  USING (public.is_member_of_group(group_id));

-- ④ group_messages の SELECT ポリシーも同様に差し替え
DROP POLICY IF EXISTS "gm_select_member" ON public.group_messages;
CREATE POLICY "gm_select_member" ON public.group_messages FOR SELECT
  USING (public.is_member_of_group(group_id));

-- ================================================================
-- 確認クエリ
-- ================================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('project_groups', 'project_group_members', 'group_messages')
  AND cmd = 'SELECT'
ORDER BY tablename;
