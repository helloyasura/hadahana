// Local integration-test fixture only. Never points at LUMS or a real customer.
import http from 'node:http';
const users = new Map(); const challenges = new Map(); let sequence = 0;
const response = (res, status, json) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(json)); };
const server = http.createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const path = req.url;
  if (path === '/__test/expiry') { for (const user of users.values()) { user.license.active = false; user.license.status = 'expired_or_suspended'; user.license.daysLeft = 0; } return response(res, 200, { ok: true }); }
  if (path === '/api/hadahana/signup') {
    const challengeId = String(++sequence).padStart(64, 'a');
    challenges.set(challengeId, users.has(body.email) ? null : body);
    return response(res, 201, { verificationRequired: true, challengeId, resendAfter: 60 });
  }
  if (path === '/api/hadahana/resend-code') return response(res, 200, { verificationRequired: true, challengeId: body.challengeId, resendAfter: 60 });
  if (path === '/api/hadahana/verify-email') {
    const pending = challenges.get(body.challengeId);
    if (!pending || body.code !== '123456') return response(res, 400, { error: 'Invalid or expired code' });
    challenges.delete(body.challengeId);
    const profile = { id: `u${++sequence}`, email: pending.email, name: pending.name, license: { active: true, status: 'trial', expiresAt: new Date(Date.now() + 20 * 86400000).toISOString(), trialEndsAt: new Date(Date.now() + 20 * 86400000).toISOString(), daysLeft: 20 }, horoscopes: pending.birth ? [{ id: `h${sequence}`, birth: pending.birth, createdAt: new Date().toISOString() }] : [], portalUrl: 'https://lums.ervanta.com/portal' };
    users.set(pending.email, profile); return response(res, 200, { token: pending.email });
  }
  if (path === '/api/hadahana/login') { if (!users.has(body.email)) return response(res, 401, { error: 'Invalid credentials' }); return response(res, 200, { token: body.email }); }
  const profile = users.get(req.headers.authorization?.replace(/^Bearer /, ''));
  if (!profile) return response(res, 401, { error: 'Please sign in' });
  if (path === '/api/hadahana/me') return response(res, 200, { profile });
  if (path === '/api/hadahana/horoscopes') {
    if (!profile.license.active) return response(res, 402, { error: 'Expired' });
    const same = profile.horoscopes.find(h => JSON.stringify(h.birth) === JSON.stringify(body.birth));
    if (same) return response(res, 200, { id: same.id });
    const id = `h${++sequence}`;
    profile.horoscopes.unshift({ id, birth: body.birth, createdAt: new Date().toISOString() });
    return response(res, 200, { id });
  }
  return response(res, 404, { error: 'Not found' });
});
server.listen(Number(process.env.PROFILE_FIXTURE_PORT || 4314), '127.0.0.1', () => console.log('Profile fixture ready (local mock LUMS)'));
