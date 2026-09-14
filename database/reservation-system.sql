-- 独立预约系统：本脚本不会读取、修改或删除任何旧表。
-- 请在 Supabase SQL Editor 中手动执行。

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.reservation_settings (
  id smallint primary key default 1 check (id = 1),
  is_enabled boolean not null default false,
  booking_opens_at timestamptz not null,
  booking_closes_at timestamptz not null,
  check (booking_opens_at < booking_closes_at)
);

create table if not exists public.reservation_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  slot_date date not null,
  time_slot text not null,
  capacity smallint not null check (capacity > 0),
  is_open boolean not null default true,
  unique (slot_date, time_slot)
);

create table if not exists public.reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  name_key text not null unique,
  reservation_code text not null unique,
  slot_id uuid not null references public.reservation_slots(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 100),
  kana text not null check (char_length(trim(kana)) between 1 and 100),
  nationality text not null check (char_length(trim(nationality)) between 1 and 100),
  status text not null check (char_length(trim(status)) between 1 and 100),
  created_at timestamptz not null default now()
);

create index if not exists reservations_slot_id_index on public.reservations(slot_id);

create table if not exists public.reservation_staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.reservation_settings (id, is_enabled, booking_opens_at, booking_closes_at)
values (1, false, '2026-09-14 09:00:00+09', '2026-09-23 23:59:59+09')
on conflict (id) do nothing;

-- 初始时段；之后可从预约管理页面增加或更新。
insert into public.reservation_slots (slot_date, time_slot, capacity) values
  ('2026-09-24','9:00 - 9:30',2), ('2026-09-25','9:00 - 9:30',1), ('2026-09-30','9:00 - 9:30',1),
  ('2026-09-24','9:30 - 10:00',2), ('2026-09-25','9:30 - 10:00',1), ('2026-09-30','9:30 - 10:00',1),
  ('2026-09-24','10:00 - 10:30',2), ('2026-09-25','10:00 - 10:30',1), ('2026-09-28','10:00 - 10:30',1),
  ('2026-09-24','10:30 - 11:00',2), ('2026-09-25','10:30 - 11:00',1), ('2026-09-28','10:30 - 11:00',1),
  ('2026-09-24','11:00 - 11:30',2), ('2026-09-25','11:00 - 11:30',1), ('2026-09-28','11:00 - 11:30',1),
  ('2026-09-24','11:30 - 12:00',2), ('2026-09-25','11:30 - 12:00',1), ('2026-09-28','11:30 - 12:00',1),
  ('2026-09-24','13:00 - 13:30',2), ('2026-09-25','13:00 - 13:30',1),
  ('2026-09-24','13:30 - 14:00',2), ('2026-09-25','13:30 - 14:00',1),
  ('2026-09-24','14:00 - 14:30',2), ('2026-09-25','14:00 - 14:30',1),
  ('2026-09-24','14:30 - 15:00',2), ('2026-09-25','14:30 - 15:00',1),
  ('2026-09-24','15:00 - 15:30',1), ('2026-09-28','15:00 - 15:30',1),
  ('2026-09-24','15:30 - 16:00',1), ('2026-09-28','15:30 - 16:00',1),
  ('2026-09-24','16:00 - 16:30',1), ('2026-09-25','16:00 - 16:30',1), ('2026-09-28','16:00 - 16:30',1),
  ('2026-09-24','16:30 - 17:00',1), ('2026-09-25','16:30 - 17:00',1), ('2026-09-28','16:30 - 17:00',1)
on conflict (slot_date, time_slot) do nothing;

alter table public.reservation_settings enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_staff_users enable row level security;

create or replace function public.is_reservation_staff()
returns boolean language sql security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.reservation_staff_users where user_id = auth.uid()
  );
$$;

create or replace function public.get_reservation_schedule()
returns table (slot_date date, time_slot text, remaining integer)
language sql security definer set search_path = public as $$
  select s.slot_date, s.time_slot, greatest(s.capacity - count(r.id)::integer, 0)
  from public.reservation_slots s
  cross join public.reservation_settings cfg
  left join public.reservations r on r.slot_id = s.id
  where s.is_open and cfg.is_enabled and now() between cfg.booking_opens_at and cfg.booking_closes_at
  group by s.slot_date, s.time_slot, s.capacity
  order by s.slot_date, s.time_slot;
$$;

create or replace function public.create_reservation(
  p_slot_date date, p_time_slot text, p_name text, p_kana text, p_nationality text, p_status text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_slot_id uuid; v_capacity smallint; v_used integer; v_name_key text; v_code text;
begin
  if not exists (select 1 from public.reservation_settings where is_enabled and now() between booking_opens_at and booking_closes_at) then
    raise exception 'closed';
  end if;
  if char_length(trim(p_name)) not between 1 and 100
    or char_length(trim(p_kana)) not between 1 and 100
    or char_length(trim(p_nationality)) not between 1 and 100
    or char_length(trim(p_status)) not between 1 and 100 then
    raise exception 'invalid_input';
  end if;
  v_name_key := lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'));
  if exists (select 1 from public.reservations where name_key = v_name_key) then raise exception 'already_reserved'; end if;
  select id, capacity into v_slot_id, v_capacity from public.reservation_slots
  where slot_date=p_slot_date and time_slot=p_time_slot and is_open for update;
  if v_slot_id is null then raise exception 'invalid_slot'; end if;
  select count(*) into v_used from public.reservations where slot_id=v_slot_id;
  if v_used >= v_capacity then raise exception 'slot_full'; end if;
  v_code := upper(encode(extensions.gen_random_bytes(8), 'hex'));
  insert into public.reservations(name_key,reservation_code,slot_id,name,kana,nationality,status)
  values(v_name_key,v_code,v_slot_id,trim(p_name),trim(p_kana),trim(p_nationality),trim(p_status));
  return v_code;
end; $$;

create or replace function public.find_my_reservation(p_reservation_code text)
returns table (slot_date date,time_slot text,name text,kana text,nationality text,status text)
language sql security definer set search_path = public as $$
  select s.slot_date,s.time_slot,r.name,r.kana,r.nationality,r.status
  from public.reservations r join public.reservation_slots s on s.id=r.slot_id
  where r.reservation_code=upper(trim(p_reservation_code));
$$;

create or replace function public.cancel_my_reservation(p_reservation_code text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.reservations where reservation_code=upper(trim(p_reservation_code));
  return found;
end; $$;

create or replace function public.get_admin_reservations()
returns table (slot_date date,time_slot text,name text,kana text,nationality text,status text,created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_reservation_staff() then raise exception 'staff_only'; end if;
  return query select s.slot_date,s.time_slot,r.name,r.kana,r.nationality,r.status,r.created_at
  from public.reservations r join public.reservation_slots s on s.id=r.slot_id order by s.slot_date,s.time_slot;
end; $$;

create or replace function public.get_admin_slots()
returns table (slot_date date,time_slot text,capacity smallint,is_open boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_reservation_staff() then raise exception 'staff_only'; end if;
  return query select s.slot_date,s.time_slot,s.capacity,s.is_open from public.reservation_slots s order by s.slot_date,s.time_slot;
end; $$;

create or replace function public.save_admin_slot(p_slot_date date,p_time_slot text,p_capacity smallint,p_is_open boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_reservation_staff() then raise exception 'staff_only'; end if;
  insert into public.reservation_slots(slot_date,time_slot,capacity,is_open) values(p_slot_date,p_time_slot,p_capacity,p_is_open)
  on conflict(slot_date,time_slot) do update set capacity=excluded.capacity,is_open=excluded.is_open;
end; $$;

create or replace function public.get_admin_settings()
returns table (is_enabled boolean,booking_opens_at timestamptz,booking_closes_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_reservation_staff() then raise exception 'staff_only'; end if;
  return query select is_enabled,booking_opens_at,booking_closes_at from public.reservation_settings where id=1;
end; $$;

create or replace function public.save_admin_settings(p_is_enabled boolean,p_opens_at timestamptz,p_closes_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_reservation_staff() then raise exception 'staff_only'; end if;
  if p_opens_at>=p_closes_at then raise exception 'invalid_period'; end if;
  update public.reservation_settings set is_enabled=p_is_enabled,booking_opens_at=p_opens_at,booking_closes_at=p_closes_at where id=1;
end; $$;

revoke all on table public.reservation_settings,public.reservation_slots,public.reservations,public.reservation_staff_users from anon,authenticated;
revoke all on function public.get_reservation_schedule(),public.create_reservation(date,text,text,text,text,text),public.find_my_reservation(text),public.cancel_my_reservation(text),public.get_admin_reservations(),public.get_admin_slots(),public.save_admin_slot(date,text,smallint,boolean),public.get_admin_settings(),public.save_admin_settings(boolean,timestamptz,timestamptz) from public;
grant execute on function public.get_reservation_schedule(),public.create_reservation(date,text,text,text,text,text),public.find_my_reservation(text),public.cancel_my_reservation(text) to anon,authenticated;
grant execute on function public.get_admin_reservations(),public.get_admin_slots(),public.save_admin_slot(date,text,smallint,boolean),public.get_admin_settings(),public.save_admin_settings(boolean,timestamptz,timestamptz) to authenticated;

-- 工作人员完成 Supabase Auth 登录后，将其 UUID 加入白名单：
-- insert into public.reservation_staff_users(user_id) values ('auth.users 中的工作人员 UUID');
