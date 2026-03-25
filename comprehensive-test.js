const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'https://scheduling-app-two.vercel.app';
const results = [];
let testNum = 0;

function fetch(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  testNum++;
  const num = String(testNum).padStart(2, '0');
  try {
    const result = await fn();
    if (result === true || result === undefined) {
      results.push({ num, name, status: '✅ PASS' });
    } else {
      results.push({ num, name, status: '❌ FAIL', detail: result });
    }
  } catch (e) {
    results.push({ num, name, status: '❌ FAIL', detail: e.message });
  }
}

async function run() {
  // Get test pages
  const pages = await prisma.schedulingPage.findMany({
    where: { isPublished: true },
    include: { weekdayRules: true, timeRules: true },
  });
  const page4 = pages.find(p => p.title === 'テスト4');
  const page3 = pages.find(p => p.title === 'テスト3');
  const slug4 = page4?.slug || 'ZJqm7Y-Bm7';
  const slug3 = page3?.slug || 'JTdiwwX1nE';

  // === Category 1: Public URL Access ===
  await test('公開ページ(テスト4)にアクセスできる', async () => {
    const r = await fetch('/book/' + slug4);
    return r.status === 200;
  });

  await test('公開ページ(テスト3)にアクセスできる', async () => {
    const r = await fetch('/book/' + slug3);
    return r.status === 200;
  });

  await test('存在しないslugは404', async () => {
    const r = await fetch('/api/public/nonexistent-slug/availability');
    return r.status === 404;
  });

  await test('空文字slugは404', async () => {
    const r = await fetch('/api/public//availability');
    return r.status === 404 || r.status === 405;
  });

  // === Category 2: Availability API ===
  await test('テスト4のavailability取得成功', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    return r.status === 200 && r.body.slots && r.body.page;
  });

  await test('テスト3のavailability取得成功', async () => {
    const r = await fetch('/api/public/' + slug3 + '/availability');
    return r.status === 200 && r.body.slots && r.body.page;
  });

  await test('availabilityにpage情報が含まれる', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    const p = r.body.page;
    return p.title && p.timezone && p.slotMinutes && p.mode;
  });

  await test('スロットにstart/end/dateがある', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    if (r.body.slots.length === 0) return 'no slots';
    const s = r.body.slots[0];
    return s.start && s.end && s.date;
  });

  await test('スロットのstart < end', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    return r.body.slots.every(s => new Date(s.start) < new Date(s.end));
  });

  await test('全スロットが未来の時間', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    const now = Date.now();
    return r.body.slots.every(s => new Date(s.start).getTime() > now - 60000);
  });

  await test('スロット間隔がslotMinutes(30分)と一致', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    return r.body.slots.every(s => {
      const diff = (new Date(s.end) - new Date(s.start)) / 60000;
      return diff === r.body.page.slotMinutes;
    });
  });

  await test('平日のみ(テスト4は月-金)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    return r.body.slots.every(s => {
      const day = new Date(s.start).getUTCDay();
      // UTC to JST consideration: slots at 00:00 UTC = 09:00 JST (still same day in most cases)
      const jstDate = new Date(new Date(s.start).getTime() + 9 * 3600000);
      const jstDay = jstDate.getDay();
      return jstDay >= 1 && jstDay <= 5;
    });
  });

  await test('時間帯が09:00-18:00内(JST)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    return r.body.slots.every(s => {
      const jst = new Date(new Date(s.start).getTime() + 9 * 3600000);
      const h = jst.getUTCHours();
      const m = jst.getUTCMinutes();
      const startMin = h * 60 + m;
      return startMin >= 540 && startMin < 1080; // 9:00 - 18:00
    });
  });

  await test('COMMON_FREEモードでavailableGroupIdsが全グループ含む', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    if (r.body.slots.length === 0) return 'no slots';
    return r.body.slots[0].availableGroupIds && r.body.slots[0].availableGroupIds.length >= 2;
  });

  await test('非公開ページはavailabilityが404', async () => {
    const unpublished = await prisma.schedulingPage.findFirst({ where: { isPublished: false } });
    if (!unpublished) return true; // skip if all published
    const r = await fetch('/api/public/' + unpublished.slug + '/availability');
    return r.status === 404;
  });

  // === Category 3: Lock API ===
  await test('未来のスロットをロックできる', async () => {
    const r = await fetch('/api/public/' + slug4 + '/lock', 'POST', {
      slotStart: '2026-04-22T04:00:00.000Z',
      slotEnd: '2026-04-22T04:30:00.000Z',
    });
    return r.status === 200 && r.body.success;
  });

  await test('同じスロットの二重ロックは409', async () => {
    const r = await fetch('/api/public/' + slug4 + '/lock', 'POST', {
      slotStart: '2026-04-22T04:00:00.000Z',
      slotEnd: '2026-04-22T04:30:00.000Z',
    });
    return r.status === 409;
  });

  await test('別スロットはロック可能', async () => {
    const r = await fetch('/api/public/' + slug4 + '/lock', 'POST', {
      slotStart: '2026-04-22T04:30:00.000Z',
      slotEnd: '2026-04-22T05:00:00.000Z',
    });
    return r.status === 200;
  });

  await test('不正なslotStartでロック失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/lock', 'POST', {
      slotStart: 'invalid-date',
      slotEnd: '2026-04-22T05:00:00.000Z',
    });
    return r.status === 400;
  });

  await test('非公開ページへのロックは404', async () => {
    const r = await fetch('/api/public/nonexistent/lock', 'POST', {
      slotStart: '2026-04-22T04:00:00.000Z',
      slotEnd: '2026-04-22T04:30:00.000Z',
    });
    return r.status === 404;
  });

  // === Category 4: Booking API - Validation ===
  await test('名前なしで予約失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T01:00:00.000Z',
      slotEnd: '2026-04-21T01:30:00.000Z',
      email: 'test@example.com',
    });
    return r.status === 400;
  });

  await test('メールなしで予約失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T01:00:00.000Z',
      slotEnd: '2026-04-21T01:30:00.000Z',
      personName: 'テスト',
    });
    return r.status === 400;
  });

  await test('不正メール形式で予約失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T01:00:00.000Z',
      slotEnd: '2026-04-21T01:30:00.000Z',
      personName: 'テスト',
      email: 'not-an-email',
    });
    return r.status === 400;
  });

  await test('slotStart未指定で予約失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      personName: 'テスト',
      email: 'test@example.com',
    });
    return r.status === 400;
  });

  await test('空bodyで予約失敗(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {});
    return r.status === 400;
  });

  await test('非公開ページへの予約は404', async () => {
    const r = await fetch('/api/public/nonexistent/book', 'POST', {
      slotStart: '2026-04-21T01:00:00.000Z',
      slotEnd: '2026-04-21T01:30:00.000Z',
      personName: 'テスト',
      email: 'test@example.com',
    });
    return r.status === 404;
  });

  // === Category 5: Booking - Success & Conflicts ===
  await test('正常な予約が成功(200)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T02:00:00.000Z',
      slotEnd: '2026-04-21T02:30:00.000Z',
      personName: 'テスト50パターン',
      email: 'test-50@example.com',
      companyName: 'テスト会社',
    });
    return r.status === 200 && r.body.success && r.body.booking?.id;
  });

  await test('同じ時間帯の二重予約は409', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T02:00:00.000Z',
      slotEnd: '2026-04-21T02:30:00.000Z',
      personName: '重複テスト',
      email: 'dup@example.com',
    });
    return r.status === 409;
  });

  await test('重複時間帯(一部重複)も409', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T01:45:00.000Z',
      slotEnd: '2026-04-21T02:15:00.000Z',
      personName: '部分重複テスト',
      email: 'overlap@example.com',
    });
    return r.status === 409;
  });

  await test('隣接時間帯(重複なし)は予約可能', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T02:30:00.000Z',
      slotEnd: '2026-04-21T03:00:00.000Z',
      personName: '隣接テスト',
      email: 'adjacent@example.com',
    });
    return r.status === 200 && r.body.success;
  });

  // === Category 6: Booking DB Integrity ===
  await test('予約がDBに保存されている', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    return !!booking && booking.status === 'CONFIRMED';
  });

  await test('予約にcancelTokenが設定されている', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    return !!booking?.cancelToken;
  });

  await test('予約のstartAt/endAtが正しいタイムスタンプ', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    return booking?.startAt instanceof Date && booking?.endAt instanceof Date;
  });

  await test('予約にassignedConnectedCalendarIdが設定されている', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    return !!booking?.assignedConnectedCalendarId;
  });

  await test('予約にGoogleEventIDが設定されている', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    return !!booking?.googleEventId;
  });

  // === Category 7: Availability after booking ===
  await test('予約済みスロットがavailabilityから除外される', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    const slot = r.body.slots.find(s => s.start === '2026-04-21T02:00:00.000Z');
    return !slot; // should not exist
  });

  await test('予約済みの隣接スロットもavailabilityから除外される', async () => {
    const r = await fetch('/api/public/' + slug4 + '/availability');
    const slot = r.body.slots.find(s => s.start === '2026-04-21T02:30:00.000Z');
    return !slot; // should not exist (booked by adjacent test)
  });

  // === Category 8: Cancel API ===
  await test('無効なIDでキャンセルは404', async () => {
    const r = await fetch('/api/bookings/nonexistent/cancel', 'POST');
    return r.status === 401 || r.status === 404;
  });

  await test('トークンなし+未認証でキャンセルは401', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: 'テスト50パターン' },
    });
    const r = await fetch('/api/bookings/' + booking.id + '/cancel', 'POST');
    return r.status === 401;
  });

  await test('正しいトークンでキャンセル成功', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: '隣接テスト', status: 'CONFIRMED' },
    });
    if (!booking) return 'booking not found';
    const r = await fetch('/api/bookings/' + booking.id + '/cancel?token=' + booking.cancelToken, 'POST');
    return r.status === 200 || r.status === 302; // redirect or json
  });

  await test('キャンセル済み予約の再キャンセルは404', async () => {
    const booking = await prisma.booking.findFirst({
      where: { personName: '隣接テスト', status: 'CANCELLED' },
    });
    if (!booking) return 'booking not found';
    const r = await fetch('/api/bookings/' + booking.id + '/cancel?token=' + booking.cancelToken, 'POST');
    return r.status === 404;
  });

  // === Category 9: Auth-required APIs (without auth) ===
  await test('GET /api/google/accounts は認証必要(401)', async () => {
    const r = await fetch('/api/google/accounts');
    return r.status === 401;
  });

  await test('GET /api/scheduling-pages は認証必要(401)', async () => {
    const r = await fetch('/api/scheduling-pages');
    return r.status === 401;
  });

  await test('POST /api/scheduling-pages は認証必要(401)', async () => {
    const r = await fetch('/api/scheduling-pages', 'POST', { title: 'test' });
    return r.status === 401;
  });

  await test('GET /api/bookings は認証必要(401)', async () => {
    const r = await fetch('/api/bookings');
    return r.status === 401;
  });

  await test('POST /api/google/disconnect は認証必要(401)', async () => {
    const r = await fetch('/api/google/disconnect', 'POST', { accountId: 'test' });
    return r.status === 401;
  });

  // === Category 10: Data consistency ===
  await test('SchedulingPageのweekdayRulesが7曜日分ある', async () => {
    const rules = await prisma.schedulingPageWeekdayRule.findMany({
      where: { schedulingPageId: page4.id },
    });
    return rules.length === 7;
  });

  await test('SchedulingPageのtimeRulesが存在する', async () => {
    const rules = await prisma.schedulingPageTimeRule.findMany({
      where: { schedulingPageId: page4.id },
    });
    return rules.length > 0;
  });

  await test('timeRulesのstartTime < endTime', async () => {
    const rules = await prisma.schedulingPageTimeRule.findMany({
      where: { schedulingPageId: page4.id },
    });
    return rules.every(r => r.startTime < r.endTime);
  });

  await test('ConnectedGoogleAccountにrefreshTokenがある', async () => {
    const accounts = await prisma.connectedGoogleAccount.findMany();
    return accounts.every(a => !!a.refreshToken);
  });

  await test('CalendarGroupのメンバーに代表者が1人いる', async () => {
    const groups = await prisma.calendarGroup.findMany({
      include: { members: true },
    });
    return groups.every(g => g.members.filter(m => m.isRepresentative).length === 1);
  });

  // === Category 11: Edge cases ===
  await test('過去日時の予約は拒否される', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2020-01-01T01:00:00.000Z',
      slotEnd: '2020-01-01T01:30:00.000Z',
      personName: '過去テスト',
      email: 'past@example.com',
    });
    return r.status === 409;
  });

  await test('超長い名前でも予約できる(200文字以内)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T03:30:00.000Z',
      slotEnd: '2026-04-21T04:00:00.000Z',
      personName: 'あ'.repeat(200),
      email: 'long@example.com',
    });
    return r.status === 200;
  });

  await test('201文字以上の名前は拒否(400)', async () => {
    const r = await fetch('/api/public/' + slug4 + '/book', 'POST', {
      slotStart: '2026-04-21T04:00:00.000Z',
      slotEnd: '2026-04-21T04:30:00.000Z',
      personName: 'あ'.repeat(201),
      email: 'toolong@example.com',
    });
    return r.status === 400;
  });

  // === Cleanup test bookings ===
  await prisma.booking.deleteMany({
    where: {
      personName: { in: ['テスト50パターン', '隣接テスト', '重複テスト', '部分重複テスト', '過去テスト', 'あ'.repeat(200)] },
    },
  });
  await prisma.bookingLock.deleteMany({
    where: { schedulingPageId: page4.id, slotKey: { startsWith: '2026-04-22' } },
  });

  // Print results
  console.log('\n========================================');
  console.log('  テスト結果: ' + results.filter(r => r.status.includes('PASS')).length + '/' + results.length + ' passed');
  console.log('========================================\n');
  
  results.forEach(r => {
    const line = r.num + '. ' + r.status + ' ' + r.name;
    console.log(line);
    if (r.detail) console.log('    → ' + r.detail);
  });

  const failed = results.filter(r => r.status.includes('FAIL'));
  if (failed.length > 0) {
    console.log('\n❌ ' + failed.length + ' tests failed');
  } else {
    console.log('\n✅ All tests passed!');
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
