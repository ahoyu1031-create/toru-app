-- ===================================================================
-- TORU v0.1: Row Level Security (RLS) ポリシー
-- ===================================================================
-- 方針:
--   - 全テーブルで RLS を有効化
--   - 会社単位のデータは current_user_company_ids() で絞る
--   - public_unit_price_master は全認証ユーザー read-only
-- ===================================================================

alter table public.users                    enable row level security;
alter table public.companies                enable row level security;
alter table public.company_member           enable row level security;
alter table public.subscriptions            enable row level security;
alter table public.public_unit_price_master enable row level security;
alter table public.unit_price_master        enable row level security;
alter table public.quotes                   enable row level security;
alter table public.quote_items              enable row level security;

-- -------------------------------------------------------------------
-- users: 本人のみ参照・更新
-- -------------------------------------------------------------------
create policy users_select_self
  on public.users for select
  using (id = auth.uid());

create policy users_update_self
  on public.users for update
  using (id = auth.uid());

-- -------------------------------------------------------------------
-- companies: 所属メンバーのみ参照、Owner のみ更新、認証済ユーザーは作成可
-- -------------------------------------------------------------------
create policy companies_select_member
  on public.companies for select
  using (id in (select public.current_user_company_ids()));

create policy companies_update_owner
  on public.companies for update
  using (
    id in (
      select company_id from public.company_member
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy companies_insert_auth
  on public.companies for insert
  with check (auth.uid() is not null);

-- -------------------------------------------------------------------
-- company_member: 同じ会社メンバー間でのみ可視
-- -------------------------------------------------------------------
create policy company_member_select_same_company
  on public.company_member for select
  using (company_id in (select public.current_user_company_ids()));

-- 本人は自分のレコードを挿入できる（会社作成時の初期オーナー登録など）
create policy company_member_insert_self
  on public.company_member for insert
  with check (user_id = auth.uid());

-- オーナー/管理者は他メンバーを追加できる
create policy company_member_insert_admin
  on public.company_member for insert
  with check (
    company_id in (
      select company_id from public.company_member
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy company_member_delete_admin
  on public.company_member for delete
  using (
    company_id in (
      select company_id from public.company_member
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- -------------------------------------------------------------------
-- subscriptions: 所属会社メンバーのみ閲覧
-- 書き込みは基本サーバー側（service_role）で行う
-- -------------------------------------------------------------------
create policy subscriptions_select_member
  on public.subscriptions for select
  using (company_id in (select public.current_user_company_ids()));

-- -------------------------------------------------------------------
-- public_unit_price_master: 全認証ユーザー read-only
-- -------------------------------------------------------------------
create policy public_unit_price_select_auth
  on public.public_unit_price_master for select
  using (auth.uid() is not null);

-- -------------------------------------------------------------------
-- unit_price_master: 所属会社メンバーのみ R/W
-- -------------------------------------------------------------------
create policy unit_price_master_select
  on public.unit_price_master for select
  using (company_id in (select public.current_user_company_ids()));

create policy unit_price_master_insert
  on public.unit_price_master for insert
  with check (company_id in (select public.current_user_company_ids()));

create policy unit_price_master_update
  on public.unit_price_master for update
  using (company_id in (select public.current_user_company_ids()));

create policy unit_price_master_delete
  on public.unit_price_master for delete
  using (company_id in (select public.current_user_company_ids()));

-- -------------------------------------------------------------------
-- quotes: 所属会社メンバーのみ R/W
-- -------------------------------------------------------------------
create policy quotes_select
  on public.quotes for select
  using (company_id in (select public.current_user_company_ids()));

create policy quotes_insert
  on public.quotes for insert
  with check (company_id in (select public.current_user_company_ids()));

create policy quotes_update
  on public.quotes for update
  using (company_id in (select public.current_user_company_ids()));

create policy quotes_delete
  on public.quotes for delete
  using (company_id in (select public.current_user_company_ids()));

-- -------------------------------------------------------------------
-- quote_items: 親 quote の company 経由でアクセス制御
-- -------------------------------------------------------------------
create policy quote_items_select
  on public.quote_items for select
  using (
    quote_id in (
      select id from public.quotes
      where company_id in (select public.current_user_company_ids())
    )
  );

create policy quote_items_insert
  on public.quote_items for insert
  with check (
    quote_id in (
      select id from public.quotes
      where company_id in (select public.current_user_company_ids())
    )
  );

create policy quote_items_update
  on public.quote_items for update
  using (
    quote_id in (
      select id from public.quotes
      where company_id in (select public.current_user_company_ids())
    )
  );

create policy quote_items_delete
  on public.quote_items for delete
  using (
    quote_id in (
      select id from public.quotes
      where company_id in (select public.current_user_company_ids())
    )
  );
