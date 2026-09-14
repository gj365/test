const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const defaults = require('../assets/data/default-schedule.json');

// 用本地 HTTP 模拟配置 API；测试不会连接真实数据库或写入真实预约。
const sdk = `window.supabase = { createClient() { return {
  from(table) {
    if (table !== 'exam_reservations') throw new Error('Unexpected table: ' + table);
    const filters = {};
    let method = 'GET';
    const query = { select() { return query; }, eq(key, value) { filters[key] = value; return query; },
      delete() { method = 'DELETE'; return query; },
      insert(rows) { return fetch('/__mock/reservations', { method: 'POST', body: JSON.stringify(rows) }).then(r => r.json()); },
      then(resolve, reject) { return fetch('/__mock/reservations?' + new URLSearchParams(filters), { method }).then(r => r.json()).then(resolve, reject); }
    }; return query;
  },
  rpc(name, params) {
    if (name === 'get_exam_schedule') return fetch('/__mock/settings').then(r => r.json());
    if (name !== 'save_exam_schedule') throw new Error('Unexpected RPC: ' + name);
    return fetch('/__mock/save', { method: 'POST', body: JSON.stringify(params) }).then(r => r.json());
  }
}; } };`;

test('管理页只读、编辑、校验、失败保留、保存以及首页联动', async (t) => {
  let settings = { slots: structuredClone(defaults).map((slot, index) => ({ ...slot, id: String(index), booked: 0 })), revision: 1, deadline: '2026-09-23T23:59:59+09:00' };
  let saveError = null;
  let saveCalls = 0;
  let reservations = [];
  let deletedId = null;
  const root = path.resolve(__dirname, '..');
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/__mock/reservations')) {
      res.setHeader('Content-Type', 'application/json');
      const params = new URL(req.url, 'http://localhost').searchParams;
      if (req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const [record] = JSON.parse(body);
        if (reservations.some(item => item.name.trim().toLowerCase() === record.name.trim().toLowerCase())) {
          res.end(JSON.stringify({ error: { code: '23505', message: 'duplicate key' } }));
          return;
        }
        assert.ok(record.slot_id);
        assert.equal(record.date, undefined);
        assert.equal(record.time_slot, undefined);
        reservations.push({ ...record, id: 'reservation-1', created_at: '2026-09-14T01:00:00Z' });
        res.end(JSON.stringify({ data: null, error: null }));
      } else if (req.method === 'DELETE') {
        deletedId = params.get('id');
        reservations = reservations.filter(record => record.id !== deletedId);
        res.end(JSON.stringify({ data: null, error: null }));
      } else {
        const rows = reservations.filter(record => !params.has('name') || record.name === params.get('name')).map(record => {
          const slot = settings.slots.find(slot => slot.id === record.slot_id);
          const [start, end] = slot.time_slot.split(' - ');
          return { ...record, slot: { exam_date: slot.date, starts_at: start.padStart(5, '0') + ':00', ends_at: end.padStart(5, '0') + ':00' } };
        });
        res.end(JSON.stringify({ data: rows, error: null }));
      }
      return;
    }
    if (req.url === '/__mock/settings') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: settings, error: null }));
      return;
    }
    if (req.url === '/__mock/save') {
      saveCalls++;
      let body = '';
      for await (const chunk of req) body += chunk;
      const params = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      if (saveError) res.end(JSON.stringify({ error: { message: saveError } }));
      else {
        assert.equal(params.p_password, 'test-password');
        settings = { slots: params.p_slots.map((slot, index) => ({ ...slot, id: String(index), booked: 0 })), revision: settings.revision + 1, deadline: settings.deadline };
        res.end(JSON.stringify({ data: settings.revision }));
      }
      return;
    }
    const target = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) { res.writeHead(404); res.end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.setHeader('Content-Type', (types[path.extname(target)] || 'text/plain') + '; charset=utf-8');
    res.end(fs.readFileSync(target));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.clock.install({ time: new Date('2026-09-14T10:00:00+09:00') });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/https:\/\/(unpkg.com|cdn.jsdelivr.net)\//, route => route.fulfill({ contentType: 'text/javascript', body: sdk }));
  const base = 'http://127.0.0.1:' + server.address().port;
  await page.goto(base + '/schedule-admin.html');
  await page.waitForFunction(() => !document.getElementById('edit-schedule').disabled);
  assert.equal(await page.locator('#schedule-editor input:not(:disabled)').count(), 0);
  assert.equal(await page.locator('#schedule-editor input[type=date]').count(), 4);
  assert.equal(await page.locator('#schedule-editor input[type=number]').count(), 56);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const firstCapacity = page.locator('#schedule-editor input[type=number]').first();
  await firstCapacity.fill('5');
  assert.equal(settings.slots[0].capacity, 2);
  await page.getByRole('button', { name: '日本語', exact: true }).click();
  assert.equal(await firstCapacity.inputValue(), '5');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  assert.equal(await firstCapacity.inputValue(), '2');
  assert.equal(await firstCapacity.isDisabled(), true);

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await firstCapacity.fill('-1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.match(await page.locator('#schedule-message').textContent(), /valid dates/);
  assert.equal(saveCalls, 0);
  await firstCapacity.fill('5');
  saveError = 'BOOKED_SLOT';
  page.once('dialog', dialog => dialog.accept('test-password'));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('schedule-message').textContent.includes('Booked slots'));
  assert.equal(await firstCapacity.inputValue(), '5');
  assert.equal(await firstCapacity.isEnabled(), true);
  saveError = null;
  // 修改没有预约的日期与时间，验证保存后首页使用全部三个字段。
  await page.locator('#schedule-editor input[type=date]').last().fill('2026-10-01');
  await page.locator('#schedule-editor input[type=time]').first().fill('08:45');
  page.once('dialog', dialog => dialog.accept('test-password'));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('schedule-message').textContent.startsWith('Saved.'));
  assert.equal(await firstCapacity.isDisabled(), true);
  assert.equal(settings.slots[0].capacity, 5);
  assert.equal(settings.slots[0].time_slot, '8:45 - 9:30');
  assert.equal(settings.slots[3].date, '2026-10-01');
  await page.screenshot({ path: path.join(os.tmpdir(), 'uec-schedule-admin.png'), fullPage: true });
  await page.goto(base + '/index.html');
  await page.waitForSelector('td[data-capacity="5"]');
  assert.equal(await page.locator('td[data-time="8:45 - 9:30"][data-date="2026-09-24"]').textContent(), '5 seats');
  assert.match(await page.locator('#schedule thead').textContent(), /2026\/10\/1/);

  await page.goto(base + '/schedule-admin.html');
  await page.waitForFunction(() => !document.getElementById('edit-schedule').disabled);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Add date', exact: true }).click();
  await page.getByRole('button', { name: 'Add time slot', exact: true }).click();
  assert.equal(await page.locator('#schedule-editor input[type=date]').count(), 5);
  assert.equal(await page.locator('#schedule-editor input[type=number]').count(), 75);
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  // 从首页预约，检查外键提交，再验证跨场次同名拦截与按 UUID 取消。
  await page.goto(base + '/index.html');
  await page.locator('td[data-capacity="5"]').click();
  await page.waitForURL('**/input.html?*');
  await page.locator('#name').fill('Test Student');
  await page.locator('#kana').fill('テスト');
  await page.locator('#nationality').fill('Japan');
  await page.locator('#status').selectOption('JUSST Program student');
  const acceptReservation = dialog => dialog.accept();
  page.on('dialog', acceptReservation);
  await page.locator('#confirm').click();
  await page.waitForURL('**/index.html');
  page.off('dialog', acceptReservation);
  assert.equal(reservations.length, 1);
  await page.locator('td[data-capacity="1"]').first().click();
  await page.waitForURL('**/input.html?*');
  await page.locator('#name').fill('test student');
  await page.locator('#kana').fill('テスト');
  await page.locator('#nationality').fill('Japan');
  await page.locator('#status').selectOption('JUSST Program student');
  const dialogs = [];
  const duplicateDialog = dialog => { dialogs.push(dialog.message()); return dialog.accept(); };
  page.on('dialog', duplicateDialog);
  const duplicateNotice = page.waitForEvent('dialog', { predicate: dialog => dialog.message().includes('already has a reservation'), timeout: 10000 });
  await page.locator('#confirm').click();
  await duplicateNotice;
  page.off('dialog', duplicateDialog);
  assert.equal(reservations.length, 1);
  assert.ok(dialogs.some(message => message.includes('already has a reservation')));
  await page.goto(base + '/cancel.html');
  await page.locator('#name').fill('Test Student');
  await page.locator('#search').click();
  await page.waitForSelector('#result-table tbody tr');
  assert.match(await page.locator('#result-table tbody').textContent(), /2026\/9\/24/);
  page.on('dialog', acceptReservation);
  await page.locator('#result-table button').click();
  await page.waitForURL('**/index.html');
  page.off('dialog', acceptReservation);
  assert.equal(deletedId, 'reservation-1');
  assert.equal(reservations.length, 0);
  assert.deepEqual(errors, []);
});
