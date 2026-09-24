/**
 * Regression tests for the /api/cron/send-reports secret guard.
 * Run with: npm run test:cron-auth
 *
 * The endpoint builds a service-role Supabase client and returns staff profiles
 * and the permission model, so "anonymous cannot reach it" is the property that
 * matters most here.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'cron-auth-'));
const out = join(dir, 'guard.mjs');
execSync(
  `npx --yes esbuild utils/auth/cron-secret.ts --bundle --format=esm --platform=node --tsconfig=tsconfig.json --outfile=${out}`,
  { stdio: 'pipe' },
);
const { authoriseCronRequest, CRON_SECRET_HEADER } = await import(out);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL:', name)); };

const SECRET = 'a-long-random-cron-secret-value-9f3b2';

console.log('=== anonymous callers are refused ===');
{
  const noHeader = authoriseCronRequest(undefined, SECRET);
  check('no header is refused', noHeader.ok === false);
  check('no header gives 401', noHeader.status === 401);

  const nullHeader = authoriseCronRequest(null, SECRET);
  check('null header is refused', nullHeader.ok === false && nullHeader.status === 401);

  const empty = authoriseCronRequest('', SECRET);
  check('empty header is refused', empty.ok === false && empty.status === 401);

  const blank = authoriseCronRequest('   ', SECRET);
  check('whitespace-only header is refused', blank.ok === false && blank.status === 401);
}

console.log('=== wrong secrets are refused ===');
{
  const wrong = authoriseCronRequest('not-the-secret', SECRET);
  check('wrong secret is refused', wrong.ok === false && wrong.status === 401);

  // A prefix of the real secret must not pass, and must not be distinguishable
  // from any other wrong value.
  const prefix = authoriseCronRequest(SECRET.slice(0, -1), SECRET);
  check('near-miss prefix is refused', prefix.ok === false && prefix.status === 401);

  const longer = authoriseCronRequest(SECRET + 'x', SECRET);
  check('secret with extra characters is refused', longer.ok === false);

  const cased = authoriseCronRequest(SECRET.toUpperCase(), SECRET);
  check('case-changed secret is refused', cased.ok === false);

  check('every refusal reads the same', new Set(
    ['nope', SECRET.slice(0, -1), SECRET + 'x', ''].map(v => authoriseCronRequest(v, SECRET).message)
  ).size === 1);
}

console.log('=== the correct secret is allowed ===');
{
  const ok = authoriseCronRequest(SECRET, SECRET);
  check('correct secret is allowed', ok.ok === true);

  // Header values pick up whitespace in transit; the secret itself has none.
  const padded = authoriseCronRequest(`  ${SECRET}  `, SECRET);
  check('surrounding whitespace is tolerated', padded.ok === true);
}

console.log('=== an unconfigured secret fails CLOSED ===');
{
  // The trap this guard exists to avoid: `header !== process.env.CRON_SECRET`
  // is true-for-equal when both are undefined, turning an unset secret into an
  // open endpoint.
  for (const missing of [undefined, '', '   ']) {
    const r = authoriseCronRequest(undefined, missing);
    check(`unset secret (${JSON.stringify(missing)}) refuses anonymous`, r.ok === false);
    const r2 = authoriseCronRequest('anything', missing);
    check(`unset secret (${JSON.stringify(missing)}) refuses any value`, r2.ok === false);
    check(`unset secret (${JSON.stringify(missing)}) is 503, not 401`, r2.status === 503);
  }
}

console.log('=== the guard never echoes the attempt ===');
{
  const r = authoriseCronRequest('super-secret-guess', SECRET);
  const body = JSON.stringify(r);
  check('response does not contain the attempted value', !body.includes('super-secret-guess'));
  check('response does not contain the real secret', !body.includes(SECRET));
}

console.log('=== header name is the documented one ===');
check('header is x-cron-secret', CRON_SECRET_HEADER === 'x-cron-secret');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
