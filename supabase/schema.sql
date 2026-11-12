-- =====================================================================
-- 報修登記系統：Supabase 建表 SQL
-- 資料表：public.repair_requests
--
-- 本次示範規則（依「報修需求筆記.txt」）：
--   任何人可以新增、任何人可以讀取清單，但不能修改或刪除。
--   本次示範不做登入，前端只使用 anon（公開金鑰）。
--
-- 安全設計分三層，缺一層也還有其他層擋住：
--   1. GRANT ：資料庫權限，決定 anon 能對哪些「欄位」做哪些「動作」。
--   2. RLS   ：資料列安全，決定 anon 能讀寫哪些「資料列」。
--   3. CHECK ：資料表限制，決定欄位「值」是否合法，對所有角色都有效。
--
-- 本檔只定義結構與權限，請在 Supabase SQL Editor 中自行執行。
-- 整份包在交易中，任何一步失敗就全部不生效。
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 建立資料表與 CHECK 限制（第 3 層）
-- ---------------------------------------------------------------------
-- 說明：
--   * id、created_at 由資料庫自動產生，前端不需要也不允許填寫。
--   * 文字欄位先用 btrim 去掉前後空白再算長度，避免只填空白就送出。
--   * 選項欄位用 CHECK 限制只能是需求筆記列出的值。
--   * CHECK 對所有角色（包含管理後台）都有效，是最後一道防線。
create table public.repair_requests (
  -- 主鍵：自動產生的 UUID，避免流水號被猜出筆數
  id            uuid        primary key default gen_random_uuid(),

  -- 登記時間：送出時由資料庫自動填入（含時區）
  created_at    timestamptz not null default now(),

  -- 報修人姓名：必填，1～50 字（示範資料請使用虛構姓名）
  reporter_name text        not null
    constraint repair_requests_reporter_name_length
      check (char_length(btrim(reporter_name)) between 1 and 50),

  -- 地點或部門：必填，1～100 字
  location      text        not null
    constraint repair_requests_location_length
      check (char_length(btrim(location)) between 1 and 100),

  -- 類別：只能是 設備／網路／環境／其他
  category      text        not null
    constraint repair_requests_category_allowed
      check (category in ('設備', '網路', '環境', '其他')),

  -- 問題說明：必填，1～1000 字
  description   text        not null
    constraint repair_requests_description_length
      check (char_length(btrim(description)) between 1 and 1000),

  -- 緊急程度：只能是 低／中／高，未填時預設「中」
  urgency       text        not null default '中'
    constraint repair_requests_urgency_allowed
      check (urgency in ('低', '中', '高')),

  -- 處理狀態：只能是 待處理／處理中／已完成，預設「待處理」
  status        text        not null default '待處理'
    constraint repair_requests_status_allowed
      check (status in ('待處理', '處理中', '已完成'))
);

comment on table  public.repair_requests               is '報修登記資料（示範用，資料全為虛構）';
comment on column public.repair_requests.id            is '主鍵，自動產生的 UUID';
comment on column public.repair_requests.created_at    is '登記時間，系統自動產生';
comment on column public.repair_requests.reporter_name is '報修人姓名';
comment on column public.repair_requests.location      is '地點或部門';
comment on column public.repair_requests.category      is '類別：設備、網路、環境、其他';
comment on column public.repair_requests.description   is '問題說明';
comment on column public.repair_requests.urgency       is '緊急程度：低、中、高（預設中）';
comment on column public.repair_requests.status        is '處理狀態：待處理、處理中、已完成（預設待處理）';

-- 清單依登記時間由新到舊顯示，建立索引加快排序
create index repair_requests_created_at_idx
  on public.repair_requests (created_at desc);

-- ---------------------------------------------------------------------
-- 第 1 層：GRANT 資料庫權限
-- ---------------------------------------------------------------------
-- 這個 Supabase 專案不會自動開放新資料表給 API 角色，
-- 所以先把所有權限收回，再只開放需要的部分。
revoke all on table public.repair_requests from public, anon, authenticated;

-- anon 需要能使用 public schema，才能透過 API 存取其中的資料表
grant usage on schema public to anon;

-- 讀取：anon 可以讀取整份清單
grant select on table public.repair_requests to anon;

-- 新增：只開放表單需要填寫的 5 個欄位。
--   * 不開放 id、created_at：由資料庫自動產生，前端不能偽造。
--   * 不開放 status：新增時一律套用預設值「待處理」；
--     前端若傳入 status，資料庫會直接拒絕（permission denied）。
grant insert (reporter_name, location, category, description, urgency)
  on table public.repair_requests to anon;

-- 不授予 update、delete、truncate：anon 不能修改或刪除任何資料。
-- authenticated 也沒有任何權限：本次示範不做登入，日後加入登入時再另行設計。

-- ---------------------------------------------------------------------
-- 第 2 層：RLS 資料列安全
-- ---------------------------------------------------------------------
-- 啟用 RLS 後，沒有政策允許的操作一律被拒絕。
-- 公開金鑰會放在網頁前端，必須先啟用 RLS 才能對外開放。
alter table public.repair_requests enable row level security;

-- 讀取政策：任何人（anon）都可以讀取全部清單
create policy repair_requests_select_anon
  on public.repair_requests
  for select
  to anon
  using (true);

-- 新增政策：任何人（anon）都可以新增，但新資料的 status 只能是「待處理」。
-- 第 1 層已經不讓 anon 填 status；這裡再檢查一次，
-- 萬一日後 GRANT 被放寬，也不能直接新增「已完成」的資料。
create policy repair_requests_insert_anon
  on public.repair_requests
  for insert
  to anon
  with check (status = '待處理');

-- 不建立 update、delete 政策：即使日後誤授予 GRANT，RLS 仍會拒絕修改與刪除。

commit;
