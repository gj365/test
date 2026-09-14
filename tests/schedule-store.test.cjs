const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const defaults = require('../assets/data/default-schedule.json');

/** 在隔离环境中加载业务模块，避免测试访问真实 Supabase。 */
function setup(client = {}, fetch = async () => ({ ok: true, json: async () => defaults })) {
  const context = { window: { ReservationApp: { client } }, fetch };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/schedule-store.js'), 'utf8'), context);
  return context.window.ScheduleStore;
}

/** 构造新场次 RPC 读取接口，禁止回退到旧表。 */
function reader(response) {
  return { rpc: async (name) => { assert.equal(name, 'get_exam_schedule'); return response; } };
}

test('原始排期保持 4 天、14 个时间段、46 个名额，新系统统一 ISO 日期', () => {
  const store = setup();
  assert.equal(store.validate(defaults), '');
  assert.equal(store.grid(defaults).dates.length, 4);
  assert.equal(store.grid(defaults).times.length, 14);
  assert.equal(defaults.reduce((sum, slot) => sum + slot.capacity, 0), 46);
  assert.equal(store.enrollmentDate('2026-09-24'), '2026-09-24');
  assert.equal(store.enrollmentDate('2027-01-02'), '2027-01-02');
  assert.equal(store.timeRange('09:00', '09:30'), '9:00 - 9:30');
});

test('拒绝无效日期、容量、重复及交叉时间，允许关闭场次', () => {
  const store = setup();
  const base = defaults[0];
  for (const change of [{ date: '2026-02-30' }, { capacity: -1 }, { capacity: 1.5 }, { capacity: NaN }, { capacity: 1000 }, { time_slot: '10:00 - 9:00' }, { time_slot: '23:00 - 24:00' }]) {
    assert.equal(store.validate([{ ...base, ...change }]), 'invalidSchedule');
  }
  assert.equal(store.validate([null]), 'invalidSchedule');
  assert.equal(store.validate([]), 'invalidSchedule');
  assert.equal(store.validate([base, base]), 'duplicateSchedule');
  assert.equal(store.validate([base, { ...base, time_slot: '9:15 - 10:00' }]), 'overlapSchedule');
  assert.equal(store.validate([{ ...base, capacity: 0 }]), '');
});

test('新接口缺失时明确报错，不回退旧表或虚构配置', async () => {
  const missing = setup(reader({ error: { code: 'PGRST202' } }));
  await assert.rejects(missing.load(), /scheduleSetup/);
  await assert.rejects(setup(reader({ error: { code: 'NETWORK' } })).load(true), /loadFailed/);
  const live = await setup(reader({ data: { slots: defaults, revision: 8 } })).load();
  assert.equal(live.revision, 8);
});

test('保存发送版本和密码；冲突、权限及已预约保护返回明确错误', async () => {
  let request;
  const store = setup({ rpc: async (name, params) => { request = { name, params }; return { data: 9 }; } });
  assert.equal((await store.save(defaults, 8, 'test-password')).revision, 9);
  assert.equal(request.name, 'save_exam_schedule');
  assert.equal(request.params.p_revision, 8);
  assert.equal(request.params.p_password, 'test-password');
  for (const [message, expected] of Object.entries({ INVALID_PASSWORD: 'adminPasswordFailed', SCHEDULE_CONFLICT: 'scheduleConflict', BOOKED_SLOT: 'bookedSchedule' })) {
    await assert.rejects(setup({ rpc: async () => ({ error: { message } }) }).save(defaults, 8, 'bad'), new RegExp(expected));
  }
});
