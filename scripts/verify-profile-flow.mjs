// Real Next.js server + local mock LUMS. No production services, email or payments.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
const port = 4313; const fixturePort = 4314;
const root = `http://127.0.0.1:${port}/hadahana`;
const shots = process.env.PROFILE_SCREENSHOTS_DIR || '/workspace/hadahana-profile-shots';
const env = { ...process.env, NEXT_PUBLIC_BASE_PATH: '/hadahana', SESSION_SECRET: randomBytes(48).toString('hex'), LUMS_API_URL: `http://127.0.0.1:${fixturePort}/api`, NEXT_PUBLIC_POSTHOG_KEY: '', NEXT_PUBLIC_GA_MEASUREMENT_ID: '' };
const fixture = spawn(process.execPath, ['scripts/profile-fixture.mjs'], { env: { ...env, PROFILE_FIXTURE_PORT: String(fixturePort) }, stdio: 'inherit' });
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--turbopack', '-p', String(port)], { env, stdio: 'inherit' });
let browser;
const protectedRoutes = ['/api/nam', '/api/panchanga', '/api/muhurta', '/api/porondam', '/api/satahana', '/api/names/suggest', '/api/names/feedback', '/api/names/reshuffle', '/api/agent/chat', '/api/nakath/suitable'];
const getRoutes = ['/api/names/meta', '/api/names/feedback', '/api/nakath/suitable', '/api/nakath/events', '/api/access', '/api/horoscopes/not-mine/pdf'];
async function checkBlocked(request, status) {
  for (const path of protectedRoutes) assert.equal((await request.post(root + path, { headers: { 'X-Hadahana-Action': '1' }, data: {} })).status(), status, path);
  for (const path of getRoutes) assert.equal((await request.get(root + path)).status(), status, path);
}
try {
  for (let i = 0; i < 180; i++) { try { const r = await fetch(root); if (r.ok) break; } catch {} if (i === 179) throw new Error('Next startup timed out'); await delay(1000); }
  await mkdir(shots, { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const page = await context.newPage();
    await page.goto(root); await page.addStyleTag({ content: 'nextjs-portal {display:none !important;}' }); await page.getByRole('button', { name: 'English', exact: true }).click();
    await checkBlocked(context.request, 401);
    assert.equal(await page.locator('.tabs button:disabled').count(), 8, 'All non-preview features start locked');
    const result = page.waitForResponse(r => r.url().endsWith('/api/cast') && r.request().method() === 'POST');
    await page.locator('.hero-cta .primary').click();
    const preview = await (await result).json();
    assert(preview.preview && !preview.chart && !preview.satahana && !preview.dosha && !preview.palapala);
    await page.locator('.horoscope-preview').waitFor();
    await page.locator('#account-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/signup-preview-${width}.png`, fullPage: true });
    await page.locator('input[name=name]').fill('Celestial Explorer');
    await page.locator('input[name=email]').fill(`explorer${width}@example.test`);
    await page.locator('input[name=password]').fill('Local-test123');
    await page.getByRole('button', { name: 'Start my 20 free days' }).click();
    await page.locator('#kendraya-satahana').waitFor({ timeout: 60000 });
    const account = await (await context.request.get(root + '/api/account')).json();
    assert.equal(account.profile.license.daysLeft, 20); assert.equal(account.profile.horoscopes.length, 1);
    assert.equal(account.profile.horoscopes[0].birth.date, '2026-11-04');
    const cookies = await context.cookies();
    const session = cookies.find(c => c.name === 'hadahana_session');
    assert(session?.httpOnly); assert.equal(session.sameSite, 'Lax'); assert.equal(session.path, '/hadahana');
    assert(!session.value.includes('example.test'));
    assert.equal((await context.request.get(root + '/api/access')).status(), 200);
    assert.equal((await context.request.get(root + '/api/horoscopes/not-mine')).status(), 404);
    const download = await context.request.get(root + `/api/horoscopes/${account.profile.horoscopes[0].id}/pdf?download=1`);
    assert.equal(download.status(), 200); assert(download.headers()['content-disposition'].includes('attachment'));
    await page.screenshot({ path: `${shots}/active-studio-${width}.png`, fullPage: true });
    await page.goto(root + '/profile'); await page.addStyleTag({ content: 'nextjs-portal {display:none !important;}' }); await page.getByText('Free trial active').waitFor();
    await page.screenshot({ path: `${shots}/profile-active-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'No horizontal overflow');
    // Expiry can never hide the profile itself, only licensed capabilities.
    await fetch(`http://127.0.0.1:${fixturePort}/__test/expiry`);
    await page.reload(); await page.addStyleTag({ content: 'nextjs-portal {display:none !important;}' }); await page.getByText('License required', { exact: true }).waitFor();
    await checkBlocked(context.request, 402);
    await page.screenshot({ path: `${shots}/profile-expired-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.locator('input[name=email]').fill(`explorer${width}@example.test`);
    await page.locator('input[name=password]').fill('Local-test123');
    await page.locator('button[type=submit]').click();
    await page.getByText('License required', { exact: true }).waitFor();
    assert.equal((await (await context.request.get(root + '/api/account')).json()).profile.horoscopes.length, 1);
    await context.close();
  }
  const context = await browser.newContext();
  const request = context.request;
  const post = (path, data) => request.post(root + path, { headers: { 'X-Hadahana-Action': '1' }, data });
  assert.equal((await request.post(root + '/api/account', { data: { action: 'logout' } })).status(), 403, 'Mutations need custom same-origin header');
  const signup = await post('/api/account', { action: 'signup', name: 'Fresh profile', email: 'fresh@example.test', password: 'Local-test123' });
  assert.equal(signup.status(), 200);
  await checkBlocked(request, 403); // Active trial is not enough without a generated horoscope.
  const cast = await post('/api/cast', { date: '1995-06-15', time: '10:30', placeId: 'colombo' });
  assert((await cast.json()).satahana, 'Active account generates/saves a full chart');
  assert.equal((await request.get(root + '/api/access')).status(), 200);
  const savedCookies = await context.cookies();
  const session = savedCookies.find(c => c.name === 'hadahana_session');
  await context.addCookies([{ ...session, value: (session.value[0] === 'A' ? 'B' : 'A') + session.value.slice(1) }]);
  assert.equal((await request.get(root + '/api/access')).status(), 401, 'Tampered session cannot authorize');
  await context.addCookies(savedCookies);
  const closed = once(fixture, 'exit'); fixture.kill('SIGTERM'); await closed;
  assert.equal((await request.get(root + '/api/access')).status(), 503, 'LUMS outage fails closed');
  const safePreview = await (await post('/api/cast', { date: '1995-06-15', time: '10:30', placeId: 'colombo' })).json();
  assert(safePreview.preview && !safePreview.satahana, 'Outage permits preview but never a full chart');
  await context.close();
  console.log('Profile E2E passed at 1280 / 390: public preview; sign-up preserves chart; httpOnly session; full export; ownership; all feature API guards; expiry; expired sign-in; durable profile.');
} finally { await browser?.close(); app.kill('SIGTERM'); fixture.kill('SIGTERM'); }
