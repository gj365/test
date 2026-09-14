# UEC 预约系统

原生 HTML/CSS/JavaScript 网站，使用一套独立的新数据库表。
旧 `enrollments` 表不再被任何页面或新 SQL 查询、写入或锁定，旧数据不自动迁移。

## 新表结构

| 新表 | 用途 | 主要字段 |
| --- | --- | --- |
| `exam_slots` | 日期、时间、考试名额 | `id` UUID 主键、`exam_date` 日期、`starts_at`/`ends_at` 时间、`capacity` 整数 |
| `exam_reservations` | 新预约记录 | `id` UUID 主键、`slot_id` 场次外键，以及原来的姓名、片假名、国籍、身份、邮箱、登记时间 |
| `exam_schedule_state` | 内部配置 | 编辑版本、报名截止时间、场次管理密码哈希 |

结构优化：

- UUID 用于准确定位预约；姓名有独立唯一索引，同一姓名只能预约一次（忽略首尾空格及英文字母大小写）。取消后可以重新预约。
- 日期与时间不再重复存在每条预约中，通过 `slot_id` 关联，避免场次信息不一致。
- 使用 `date`、`time`、`smallint` 类型及非空、长度、名额范围、开始时间小于结束时间等约束。
- 日期和时间组合唯一；预约外键阻止删除仍有预约的场次；按场次、姓名和登记时间建立索引。
- 预约插入触发器锁定场次并检查余位及截止时间；场次保存使用事务和版本号，保护现有预约并检测多人编辑冲突。
- 首页通过聚合接口读取余位，无需下载预约者个人资料。

## 部署

1. 在 Supabase SQL Editor 打开 `database/001_exam_reservation.sql`，将 `CHANGE_THIS_SCHEDULE_PASSWORD` 替换成实际场次管理密码，执行整个脚本。新预约表初始为空，场次表预置原来的 4 天、14 个时间段、46 个名额。
2. 发布根目录 HTML 和 `assets`。不要公开发布 `database` 和 `tests`。通过 HTTP/HTTPS 访问网页。
3. 从 `result.html` 进入场次管理页。默认只读，点击“编辑”后修改，点击“保存”并输入场次管理密码后生效。“放弃修改”恢复最近保存的配置。

此脚本不依赖旧表。之前方案的 `schedule_settings`、`schedule_admin_secret` 和 `save_schedule` 若已存在，可以保留，新代码不会调用它们。重复执行新脚本不覆盖已保存的场次或密码。

若已经执行过不带姓名唯一限制的新系统建表脚本，只需追加执行 `database/002_unique_reservation_name.sql`。若新表已有重复姓名，索引创建会报错，需先人工确认重复记录；脚本不会自动删除预约。

## 操作说明

- 日期为列，时间为行，每格是总名额（0–999），0 表示不可预约。
- 支持新增、删除日期及时间；至少保留一个日期和一个时间段，不允许重复日期、重复或交叉的时间段。
- 已有新预约的场次不能删除或更改日期/时间，名额不能小于已预约人数。
- 首页、预约、查询、取消及管理列表全部使用新表。初始化前页面显示配置错误，不回退到旧预约表。
- 保存场次所用密码与现有预约管理入口密码独立。预约管理入口及按姓名查询、取消的交互保持原样。新预约表保留匿名查询/插入/删除权限；本次没有新增个人登录认证。

截止时间集中保存在数据库，初始为 2026-09-23 23:59:59（日本时间）。调整截止时间或场次管理密码可在 SQL Editor 执行：

```sql
update public.exam_schedule_state
set booking_deadline = '2026-09-23T23:59:59+09:00'
where id = 1;

update public.exam_schedule_state
set password_hash = extensions.crypt('替换为新密码', extensions.gen_salt('bf', 12))
where id = 1;
```

## 检查

`node --test tests/schedule-store.test.cjs` 验证配置与接口。
`node --test tests/schedule-ui.test.cjs` 验证浏览器流程，需要可解析的 `playwright` 包，以及 Playwright Chromium 或由 `CHROME_PATH` 指定的本机 Chrome。
本地测试模拟数据库，不写入线上数据。真实外键、触发器、权限和并发控制需要在执行 SQL 后验证。
