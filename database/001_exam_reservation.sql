-- 新系统独立建表，不读取、复制、修改或锁定旧预约表。
-- 在 Supabase SQL Editor 执行前替换 CHANGE_THIS_SCHEDULE_PASSWORD。
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- 场次使用真实日期和时间类型；每个日期/时间组合唯一。
create table if not exists public.exam_slots (
  id uuid primary key default gen_random_uuid(),
  exam_date date not null check (exam_date between date '2000-01-01' and date '2099-12-31'),
  starts_at time not null,
  ends_at time not null,
  capacity smallint not null check (capacity between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_slots_time_order check (starts_at < ends_at),
  constraint exam_slots_unique_time unique (exam_date, starts_at, ends_at)
);

-- 参考原预约字段，新表以 UUID 为主键；姓名另外建立唯一索引，只允许预约一次。
-- 日期/时间由外键关联的场次提供，避免重复存储与更新不一致。
create table if not exists public.exam_reservations (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.exam_slots(id) on delete restrict,
  email text null check (email is null or char_length(email) <= 254),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  kana text not null check (char_length(btrim(kana)) between 1 and 200),
  nationality text not null check (char_length(btrim(nationality)) between 1 and 100),
  status text not null check (char_length(btrim(status)) between 1 and 100),
  created_at timestamptz not null default now()
);
create index if not exists exam_reservations_slot_idx on public.exam_reservations(slot_id);
-- 去掉首尾空格并忽略英文字母大小写，避免同一姓名通过格式变化重复预约。
create unique index if not exists exam_reservations_name_unique on public.exam_reservations(lower(btrim(name)));
create index if not exists exam_reservations_created_idx on public.exam_reservations(created_at);

-- 内部状态只保存版本、截止时间与密码哈希，不再把整张场次表存为 JSON。
create table if not exists public.exam_schedule_state (
  id integer primary key check (id = 1),
  revision integer not null default 1,
  booking_deadline timestamptz not null default '2026-09-23T23:59:59+09:00',
  password_hash text not null
);
insert into public.exam_schedule_state (id, password_hash)
values (1, extensions.crypt('CHANGE_THIS_SCHEDULE_PASSWORD', extensions.gen_salt('bf', 12)))
on conflict (id) do nothing;

-- 仅在首次创建的空场次表中初始化原排期，不复制任何旧预约记录。
insert into public.exam_slots (exam_date, starts_at, ends_at, capacity)
select s.date::date, split_part(s.time_slot, ' - ', 1)::time,
  split_part(s.time_slot, ' - ', 2)::time, s.capacity
from jsonb_to_recordset($seed$[
  {
    "date": "2026-09-24",
    "time_slot": "9:00 - 9:30",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "9:00 - 9:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "9:00 - 9:30",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "9:00 - 9:30",
    "capacity": 1
  },
  {
    "date": "2026-09-24",
    "time_slot": "9:30 - 10:00",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "9:30 - 10:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "9:30 - 10:00",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "9:30 - 10:00",
    "capacity": 1
  },
  {
    "date": "2026-09-24",
    "time_slot": "10:00 - 10:30",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "10:00 - 10:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "10:00 - 10:30",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "10:00 - 10:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "10:30 - 11:00",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "10:30 - 11:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "10:30 - 11:00",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "10:30 - 11:00",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "11:00 - 11:30",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "11:00 - 11:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "11:00 - 11:30",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "11:00 - 11:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "11:30 - 12:00",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "11:30 - 12:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "11:30 - 12:00",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "11:30 - 12:00",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "13:00 - 13:30",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "13:00 - 13:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "13:00 - 13:30",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "13:00 - 13:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "13:30 - 14:00",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "13:30 - 14:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "13:30 - 14:00",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "13:30 - 14:00",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "14:00 - 14:30",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "14:00 - 14:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "14:00 - 14:30",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "14:00 - 14:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "14:30 - 15:00",
    "capacity": 2
  },
  {
    "date": "2026-09-25",
    "time_slot": "14:30 - 15:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "14:30 - 15:00",
    "capacity": 0
  },
  {
    "date": "2026-09-30",
    "time_slot": "14:30 - 15:00",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "15:00 - 15:30",
    "capacity": 1
  },
  {
    "date": "2026-09-25",
    "time_slot": "15:00 - 15:30",
    "capacity": 0
  },
  {
    "date": "2026-09-28",
    "time_slot": "15:00 - 15:30",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "15:00 - 15:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "15:30 - 16:00",
    "capacity": 1
  },
  {
    "date": "2026-09-25",
    "time_slot": "15:30 - 16:00",
    "capacity": 0
  },
  {
    "date": "2026-09-28",
    "time_slot": "15:30 - 16:00",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "15:30 - 16:00",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "16:00 - 16:30",
    "capacity": 1
  },
  {
    "date": "2026-09-25",
    "time_slot": "16:00 - 16:30",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "16:00 - 16:30",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "16:00 - 16:30",
    "capacity": 0
  },
  {
    "date": "2026-09-24",
    "time_slot": "16:30 - 17:00",
    "capacity": 1
  },
  {
    "date": "2026-09-25",
    "time_slot": "16:30 - 17:00",
    "capacity": 1
  },
  {
    "date": "2026-09-28",
    "time_slot": "16:30 - 17:00",
    "capacity": 1
  },
  {
    "date": "2026-09-30",
    "time_slot": "16:30 - 17:00",
    "capacity": 0
  }
]$seed$::jsonb) as s(date text, time_slot text, capacity smallint)
where not exists (select 1 from public.exam_slots);

alter table public.exam_slots enable row level security;
alter table public.exam_reservations enable row level security;
alter table public.exam_schedule_state enable row level security;
revoke all on public.exam_slots, public.exam_reservations, public.exam_schedule_state from anon, authenticated;
grant select on public.exam_slots, public.exam_reservations to anon, authenticated;
grant insert (slot_id, email, name, kana, nationality, status), delete on public.exam_reservations to anon, authenticated;
drop policy if exists exam_slots_read on public.exam_slots;
create policy exam_slots_read on public.exam_slots for select to anon, authenticated using (true);
-- 保持现有按姓名查询与取消的交互；不把前端管理密码视作用户身份认证。
drop policy if exists exam_reservations_read on public.exam_reservations;
create policy exam_reservations_read on public.exam_reservations for select to anon, authenticated using (true);
drop policy if exists exam_reservations_insert on public.exam_reservations;
create policy exam_reservations_insert on public.exam_reservations for insert to anon, authenticated with check (true);
drop policy if exists exam_reservations_delete on public.exam_reservations;
create policy exam_reservations_delete on public.exam_reservations for delete to anon, authenticated using (true);

-- 预约写入在数据库端锁定场次，串行检查余位，避免并发超额。
create or replace function public.check_exam_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_capacity integer;
begin
  -- 先返回明确的同名提示；并发同名提交最终仍由唯一索引保证只成功一次。
  if exists (select 1 from public.exam_reservations where lower(btrim(name)) = lower(btrim(new.name))) then
    raise exception using errcode = '23505', message = 'DUPLICATE_NAME';
  end if;
  if now() > (select booking_deadline from public.exam_schedule_state where id = 1) then
    raise exception 'BOOKING_CLOSED';
  end if;
  select capacity into v_capacity from public.exam_slots where id = new.slot_id for update;
  if not found then raise exception 'INVALID_SLOT'; end if;
  if (select count(*) from public.exam_reservations where slot_id = new.slot_id) >= v_capacity then
    raise exception 'SLOT_FULL';
  end if;
  return new;
end;
$$;
revoke all on function public.check_exam_capacity() from public;
drop trigger if exists exam_capacity_guard on public.exam_reservations;
create trigger exam_capacity_guard before insert on public.exam_reservations
for each row execute function public.check_exam_capacity();

-- 首页只接收统计人数，不需要下载预约者个人资料；版本和场次来自同一快照。
create or replace function public.get_exam_schedule()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('revision', state.revision, 'deadline', state.booking_deadline,
    'slots', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'date', s.exam_date,
      'time_slot', extract(hour from s.starts_at)::integer::text || ':' || lpad(extract(minute from s.starts_at)::integer::text, 2, '0') || ' - ' ||
        extract(hour from s.ends_at)::integer::text || ':' || lpad(extract(minute from s.ends_at)::integer::text, 2, '0'),
      'capacity', s.capacity, 'booked', coalesce(r.booked, 0)
    ) order by s.starts_at, s.exam_date)
    from public.exam_slots s left join (
      select slot_id, count(*) booked from public.exam_reservations group by slot_id
    ) r on r.slot_id = s.id), '[]'::jsonb))
  from public.exam_schedule_state state where id = 1;
$$;
revoke all on function public.get_exam_schedule() from public;
grant execute on function public.get_exam_schedule() to anon, authenticated;

-- 校验整张表后更新新场次表，保留未变更场次的 ID。
create or replace function public.save_exam_schedule(p_slots jsonb, p_revision integer, p_password text)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_revision integer;
  v_slot jsonb;
  v_date date;
  v_start time;
  v_end time;
begin
  select password_hash into v_hash from public.exam_schedule_state where id = 1;
  if p_password is null or v_hash is null or extensions.crypt(p_password, v_hash) <> v_hash then
    raise exception 'INVALID_PASSWORD';
  end if;
  -- 只锁定新预约表，保护容量调整与预约写入之间的一致性。
  lock table public.exam_reservations in share row exclusive mode;
  select revision into v_revision from public.exam_schedule_state where id = 1 for update;
  if p_revision is distinct from v_revision then raise exception 'SCHEDULE_CONFLICT'; end if;
  if p_slots is null or jsonb_typeof(p_slots) <> 'array' then raise exception 'INVALID_SCHEDULE'; end if;
  if jsonb_array_length(p_slots) < 1 or jsonb_array_length(p_slots) > 2000 then raise exception 'INVALID_SCHEDULE'; end if;
  for v_slot in select value from jsonb_array_elements(p_slots) loop
    if jsonb_typeof(v_slot) <> 'object'
      or not (v_slot ?& array['date','time_slot','capacity'])
      or jsonb_typeof(v_slot->'date') <> 'string'
      or jsonb_typeof(v_slot->'time_slot') <> 'string'
      or jsonb_typeof(v_slot->'capacity') <> 'number'
      or (v_slot->>'date') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
      or (v_slot->>'time_slot') !~ '^([0-9]|1[0-9]|2[0-3]):[0-5][0-9] - ([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'
      or (v_slot->>'capacity') !~ '^[0-9]{1,3}$' then
      raise exception 'INVALID_SCHEDULE';
    end if;
    begin
      v_date := (v_slot->>'date')::date;
      v_start := split_part(v_slot->>'time_slot', ' - ', 1)::time;
      v_end := split_part(v_slot->>'time_slot', ' - ', 2)::time;
    exception when others then
      raise exception 'INVALID_SCHEDULE';
    end;
    if v_start >= v_end then raise exception 'INVALID_SCHEDULE'; end if;
  end loop;

  if exists (select 1 from jsonb_array_elements(p_slots) s group by s->>'date', s->>'time_slot' having count(*) > 1) then
    raise exception 'INVALID_SCHEDULE';
  end if;
  -- 保持日期×时间的完整矩阵，避免保存后补零造成下一次编辑结果不一致。
  if jsonb_array_length(p_slots) <> (
    select count(distinct s->>'date') * count(distinct s->>'time_slot') from jsonb_array_elements(p_slots) s
  ) then raise exception 'INVALID_SCHEDULE'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_slots) a cross join jsonb_array_elements(p_slots) b
    where a->>'time_slot' <> b->>'time_slot'
      and split_part(a->>'time_slot', ' - ', 1)::time < split_part(b->>'time_slot', ' - ', 2)::time
      and split_part(b->>'time_slot', ' - ', 1)::time < split_part(a->>'time_slot', ' - ', 2)::time
  ) then raise exception 'INVALID_SCHEDULE'; end if;


  if exists (
    select 1 from public.exam_slots old
    join (select slot_id, count(*) booked from public.exam_reservations group by slot_id) r on r.slot_id = old.id
    left join jsonb_to_recordset(p_slots) as s(date date, time_slot text, capacity integer)
      on s.date = old.exam_date and split_part(s.time_slot, ' - ', 1)::time = old.starts_at
      and split_part(s.time_slot, ' - ', 2)::time = old.ends_at
    where coalesce(s.capacity, 0) < r.booked
  ) then raise exception 'BOOKED_SLOT'; end if;

  delete from public.exam_slots old where not exists (
    select 1 from jsonb_to_recordset(p_slots) as s(date date, time_slot text, capacity integer)
    where s.date = old.exam_date and split_part(s.time_slot, ' - ', 1)::time = old.starts_at
      and split_part(s.time_slot, ' - ', 2)::time = old.ends_at
  );
  insert into public.exam_slots (exam_date, starts_at, ends_at, capacity)
  select s.date, split_part(s.time_slot, ' - ', 1)::time, split_part(s.time_slot, ' - ', 2)::time, s.capacity
  from jsonb_to_recordset(p_slots) as s(date date, time_slot text, capacity integer)
  on conflict (exam_date, starts_at, ends_at) do update set capacity = excluded.capacity, updated_at = now();
  update public.exam_schedule_state set revision = revision + 1 where id = 1 returning revision into v_revision;
  return v_revision;
end;
$$;
revoke all on function public.save_exam_schedule(jsonb, integer, text) from public;
grant execute on function public.save_exam_schedule(jsonb, integer, text) to anon, authenticated;
commit;
