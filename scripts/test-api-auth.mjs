/**
 * Route-level regression tests against a running production build.
 * Run with: BASE_URL=http://127.0.0.1:3100 CRON_SECRET=... npm run test:api-auth
 *
 * Unit tests cover the guard in isolation; these prove the guard is actually
 * wired into the route and that the removed endpoint is really gone.
 */
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3100';
const SECRET = process.env.CRON_SECRET;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

if (!SECRET || !INTERNAL_KEY) {
  console.error('CRON_SECRET and INTERNAL_API_KEY must match the values the server was started with.');
  process.exit(1);
}

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : (fail++, console.log('  FAIL:', name, detail));
};

const get = async (path, headers = {}) => {
  const res = await fetch(`${BASE}${path}`, { headers, redirect: 'manual' });
  let body = '';
  try { body = await res.text(); } catch {}
  return { status: res.status, body };
};

console.log('=== /api/cron/send-reports ===');
{
  const anon = await get('/api/cron/send-reports');
  check('anonymous is rejected', [401, 403].includes(anon.status), `got ${anon.status}`);
  check('anonymous leaks no profile data', !/full_name|profiles|permission/i.test(anon.body));

  const wrong = await get('/api/cron/send-reports', { 'x-cron-secret': 'wrong-secret' });
  check('wrong secret is rejected', [401, 403].includes(wrong.status), `got ${wrong.status}`);
  check('wrong secret leaks no profile data', !/full_name|profiles|permission/i.test(wrong.body));

  const near = await get('/api/cron/send-reports', { 'x-cron-secret': SECRET.slice(0, -1) });
  check('near-miss secret is rejected', [401, 403].includes(near.status), `got ${near.status}`);

  check('refusals are indistinguishable', anon.body === wrong.body && wrong.body === near.body);
  check('refusal never echoes the attempt', !wrong.body.includes('wrong-secret'));
  check('refusal never echoes the real secret', !wrong.body.includes(SECRET));

  const ok = await get('/api/cron/send-reports', { 'x-cron-secret': SECRET });
  // The handler may still fail downstream on database config; what matters is
  // that it got past the guard rather than being refused.
  check('correct secret passes the guard', ![401, 403].includes(ok.status), `got ${ok.status}`);
}

console.log('=== /api/sync/db-test (removed) ===');
{
  const gone = await get('/api/sync/db-test');

  // The app answers unknown paths with a catch-all `[...not-found]` page that
  // renders a 404 but replies 200 — a pre-existing soft-404 convention. The
  // property that matters is that the JSON handler is gone, not the status.
  check('no longer served by the API handler', !gone.body.startsWith('{'), `got ${gone.status}`);
  check('falls through to the not-found page', /not-found|Oops/i.test(gone.body));
  check('no childDatabase payload', !/childDatabase|syncReady|parentDatabase/i.test(gone.body));
  check('no CHILD_SUPABASE_URL disclosed', !/CHILD_SUPABASE_URL/i.test(gone.body));
  check('no supabase host disclosed', !/[a-z0-9]{20}\.supabase\.co/i.test(gone.body));
  check('no key-configured flags disclosed', !/SECRET_KEY|configured\"?\s*:/i.test(gone.body));
}

console.log('=== /api/reminder ===');
{
  const anon = await get('/api/reminder');
  check('anonymous is rejected', [401, 403].includes(anon.status), `got ${anon.status}`);

  const wrong = await get('/api/reminder', { 'x-internal-key': 'wrong-internal-key' });
  check('wrong key is rejected', [401, 403].includes(wrong.status), `got ${wrong.status}`);
  check('refusals are indistinguishable', anon.body === wrong.body);
  check('refusal never echoes the attempt', !wrong.body.includes('wrong-internal-key'));
  check('refusal never echoes the real key', !wrong.body.includes(INTERNAL_KEY));
  check('anonymous leaks no appointment data', !/appointment|email_address|patient/i.test(anon.body));

  const ok = await get('/api/reminder', { 'x-internal-key': INTERNAL_KEY });
  check('correct key passes the guard', ![401, 403].includes(ok.status), `got ${ok.status}`);
}

console.log('=== unrelated auth behaviour is unchanged ===');
{
  const user = await get('/api/user');
  check('/api/user still rejects anonymous', [401, 403].includes(user.status), `got ${user.status}`);

  const prot = await get('/en');
  check('protected page still redirects', prot.status === 307, `got ${prot.status}`);

  const login = await get('/login');
  check('login page still reachable', login.status === 200, `got ${login.status}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
