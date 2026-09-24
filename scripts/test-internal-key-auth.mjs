/**
 * Regression tests for the /api/reminder internal-key guard.
 * Run with: npm run test:internal-key
 *
 * The route this protects builds a service-role Supabase client and sends
 * appointment reminder emails, so an unauthorised caller could both read
 * patient appointments and trigger mail to them.
 *
 * The specific regressions guarded here are the ones the previous
 * implementation had:
 *   - `provided !== process.env.INTERNAL_API_KEY` was not constant-time
 *   - it allowed everything when the variable was unset (undefined === undefined)
 *   - it logged the supplied key, which survives compiler.removeConsole
 */
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'internal-key-'));
const out = join(dir, 'guard.mjs');
execSync(
  `npx --yes esbuild utils/auth/internal-key.ts --bundle --format=esm --platform=node --tsconfig=tsconfig.json --outfile=${out}`,
  { stdio: 'pipe' },
);
const { authoriseInternalRequest, INTERNAL_KEY_HEADER } = await import(out);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL:', name)); };

const KEY = 'internal-api-key-7c41d9e2f0ab';

console.log('=== no credential is refused ===');
for (const v of [undefined, null, '', '   ']) {
  const r = authoriseInternalRequest(v, KEY);
  check(`header ${JSON.stringify(v)} is refused`, r.ok === false);
  check(`header ${JSON.stringify(v)} gives 401`, r.status === 401);
}

console.log('=== wrong credentials are refused ===');
{
  check('wrong key refused', authoriseInternalRequest('nope', KEY).ok === false);
  check('near-miss prefix refused', authoriseInternalRequest(KEY.slice(0, -1), KEY).ok === false);
  check('extra characters refused', authoriseInternalRequest(KEY + 'x', KEY).ok === false);
  check('case change refused', authoriseInternalRequest(KEY.toUpperCase(), KEY).ok === false);
}

console.log('=== the correct credential is allowed ===');
{
  check('correct key allowed', authoriseInternalRequest(KEY, KEY).ok === true);
  check('whitespace tolerated', authoriseInternalRequest(`  ${KEY}  `, KEY).ok === true);
}

console.log('=== missing and wrong are indistinguishable ===');
{
  const missing = authoriseInternalRequest(undefined, KEY);
  const wrong = authoriseInternalRequest('some-guess', KEY);
  check('same status', missing.status === wrong.status);
  check('same message', missing.message === wrong.message);
  check('same body shape', JSON.stringify(missing) === JSON.stringify(wrong));
}

console.log('=== unset INTERNAL_API_KEY fails CLOSED ===');
{
  // The original bug: undefined header === undefined env passed the check.
  for (const missing of [undefined, '', '   ']) {
    check(`unset (${JSON.stringify(missing)}) refuses anonymous`,
      authoriseInternalRequest(undefined, missing).ok === false);
    check(`unset (${JSON.stringify(missing)}) refuses any value`,
      authoriseInternalRequest('anything', missing).ok === false);
    check(`unset (${JSON.stringify(missing)}) is 503`,
      authoriseInternalRequest('anything', missing).status === 503);
  }
}

console.log('=== the attempted key is never echoed ===');
{
  const attempt = 'guessed-internal-key-value';
  const body = JSON.stringify(authoriseInternalRequest(attempt, KEY));
  check('attempt absent from result', !body.includes(attempt));
  check('real key absent from result', !body.includes(KEY));
}

console.log('=== the route no longer logs the supplied key ===');
{
  const src = await import('node:fs').then(fs =>
    fs.readFileSync('app/api/reminder/route.ts', 'utf8'));
  check('no "Key received" log remains', !src.includes('Key received'));
  check('no console.* call passes the header value',
    !/console\.(log|warn|error|info)\([^)]*internalKey/.test(src));
  check('guard is wired in', src.includes('authoriseInternalRequest'));
}

console.log('=== header name unchanged for existing callers ===');
check('header is x-internal-key', INTERNAL_KEY_HEADER === 'x-internal-key');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
