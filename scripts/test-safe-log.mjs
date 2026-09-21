/**
 * Tests for the PHI-safe logging helpers.
 * Run with: npm run test:safe-log
 *
 * `compiler.removeConsole` keeps warn/error in production on purpose, so these
 * are the calls that reach the log stream. The property under test is that a
 * payload cannot get through even when a caller passes one.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'safe-log-'));
const out = join(dir, 'log.mjs');
execSync(
  `npx --yes esbuild utils/logging/safe-log.ts --bundle --format=esm --platform=node --tsconfig=tsconfig.json --outfile=${out}`,
  { stdio: 'pipe' },
);
const { logError, logWarn, classifyError } = await import(out);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL:', name)); };

/** Captures what actually reaches console.* */
function capture(fn) {
  const seen = [];
  const oe = console.error, ow = console.warn;
  console.error = (...a) => seen.push(a);
  console.warn = (...a) => seen.push(a);
  try { fn(); } finally { console.error = oe; console.warn = ow; }
  return JSON.stringify(seen);
}

console.log('=== allowed fields pass through ===');
{
  const o = capture(() => logError('x.failed', { code: 'E_UP', status: 502, correlationId: 'req-1', count: 3 }));
  check('code kept', o.includes('E_UP'));
  check('status kept', o.includes('502'));
  check('correlationId kept', o.includes('req-1'));
  check('count kept', o.includes('3'));
  check('event name kept', o.includes('x.failed'));
}

console.log('=== forbidden fields are dropped ===');
{
  const o = capture(() => logError('x.failed', {
    email: 'patient@example.com', phone: '+15551234567',
    first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01',
    patientId: 4711, appointmentId: 99, address: '1 Main St',
  }));
  for (const leak of ['patient@example.com', '15551234567', 'Jane', 'Doe', '1990-01-01', '4711', '1 Main St'])
    check(`dropped: ${leak}`, !o.includes(leak));
}

console.log('=== objects cannot ride in on an allowed key ===');
{
  // A whitelist on keys alone would let a payload through as `code`.
  const o = capture(() => logError('x.failed', { code: { email: 'p@example.com' } }));
  check('object on allowed key dropped', !o.includes('p@example.com'));

  const o2 = capture(() => logError('x.failed', { status: ['a@b.co'] }));
  check('array on allowed key dropped', !o2.includes('a@b.co'));
}

console.log('=== whole bodies cannot be logged ===');
{
  const body = { patient: { email: 'a@b.co', name: 'Jane' }, token: 'sb_secret_x' };
  const o = capture(() => logError('upstream.failed', body));
  check('response body dropped', !o.includes('a@b.co') && !o.includes('Jane'));
  check('token dropped', !o.includes('sb_secret_x'));
}

console.log('=== classifyError never exposes the message ===');
{
  // Supabase errors embed row values in message/details/hint.
  const pgErr = {
    code: '23505',
    message: 'duplicate key value violates unique constraint',
    details: 'Key (email)=(patient@example.com) already exists.',
    hint: null,
  };
  const c = classifyError(pgErr);
  const s = JSON.stringify(c);
  check('code kept', c.code === '23505');
  check('details not exposed', !s.includes('patient@example.com'));
  check('message not exposed', !s.includes('duplicate key'));

  const thrown = classifyError(new TypeError('Cannot read x of patient@example.com'));
  check('Error message not exposed', !JSON.stringify(thrown).includes('patient@example.com'));
  check('kind reported', thrown.kind === 'TypeError');

  check('unknown code normalised', classifyError({ code: 12345 }).code === 'UNKNOWN');
  check('long/odd code rejected', classifyError({ code: 'x'.repeat(40) }).code === 'UNKNOWN');
  check('injected code rejected', classifyError({ code: 'a b@c.com' }).code === 'UNKNOWN');
  check('null handled', classifyError(null).kind === 'null');
  check('undefined handled', classifyError(undefined).code === 'UNKNOWN');
}

console.log('=== logWarn enforces the same rule ===');
{
  const o = capture(() => logWarn('x.skipped', { code: 'NO_EMAIL', email: 'p@example.com' }));
  check('warn keeps code', o.includes('NO_EMAIL'));
  check('warn drops email', !o.includes('p@example.com'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
