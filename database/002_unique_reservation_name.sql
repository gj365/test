-- 仅用于已经执行新系统建表脚本的数据库；首次部署已包含此约束。
-- 若新表已有重复姓名，此语句会报错，不会删除或覆盖任何预约记录。
create unique index if not exists exam_reservations_name_unique
on public.exam_reservations(lower(btrim(name)));
