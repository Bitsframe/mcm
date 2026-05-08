/**
 * Invokes the Infisical CLI binary from @infisical/cli. The package's "bin"
 * shim is empty on some Windows installs; this finds infisical.exe explicitly.
 *
 * Custom subcommand (not in upstream CLI):
 *   yarn infisical pull                  → export secrets (interactive / arrow keys)
 *   yarn infisical pull production       → pull prod env to .env.local
 *   yarn infisical pull staging --stdout → same + pass-through flags
 *
 *   yarn infisical push production       → upload .env.local to Infisical prod
 *   yarn infisical push dev --file=.env.infisical
 *
 * Friendly names map to Infisical slugs: production→prod, development→dev, etc.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const { getInfisicalBinPath } = require("./resolve-infisical-bin.cjs");

const root = path.join(__dirname, "..");

/** Map CLI-friendly names to Infisical environment slugs */
function mapEnvAlias(name) {
  const n = String(name).toLowerCase().trim();
  const map = {
    production: "prod",
    prod: "prod",
    development: "dev",
    dev: "dev",
    staging: "staging",
    stage: "staging",
    stg: "staging",
  };
  return map[n] || n;
}

/**
 * Infisical's --file importer does not match Node/dotenv (e.g. single-quoted values
 * can be read as empty). Parse with dotenv and write a temp file using double-quoted values.
 */
function buildInfisicalSafeEnvFile(sourcePath) {
  const raw = fs.readFileSync(sourcePath);
  const parsed = dotenv.parse(raw);
  const lines = [];
  for (const [key, val] of Object.entries(parsed)) {
    if (val == null) {
      continue;
    }
    const s = String(val);
    if (s.trim() === "") {
      console.warn(
        `Skipping ${key}: empty value (Infisical rejects empty secrets).`
      );
      continue;
    }
    const escaped =
      '"' +
      s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") +
      '"';
    lines.push(`${key}=${escaped}`);
  }
  if (lines.length === 0) {
    throw new Error("No non-empty secrets to push after parsing the env file.");
  }
  const tmp = path.join(
    os.tmpdir(),
    `infisical-push-${Date.now()}-${process.pid}.env`
  );
  fs.writeFileSync(tmp, lines.join("\n") + "\n", "utf8");
  return tmp;
}

function runPullSubcommand(argv) {
  const fetchJs = path.join(__dirname, "fetch-infisical-env.cjs");
  const tokens = argv.slice(1);

  if (tokens.length === 0) {
    return spawnSync(process.execPath, [fetchJs], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    });
  }

  const first = tokens[0];
  if (first.startsWith("-")) {
    return spawnSync(process.execPath, [fetchJs, ...tokens], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    });
  }

  const slug = mapEnvAlias(first);
  const more = tokens.slice(1);
  return spawnSync(
    process.execPath,
    [fetchJs, `--env=${slug}`, "--no-interactive", ...more],
    {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    }
  );
}

/**
 * Push local dotenv file to Infisical (infisical secrets set --file=...).
 * Default file: .env.local in project root.
 */
function runPushSubcommand(argv, bin) {
  const tokens = argv.slice(1);

  if (tokens.length === 0) {
    console.error(`Usage: yarn infisical push <environment> [--file=path] [...]

Upload a local env file to Infisical for the given environment.

Examples:
  yarn infisical push production
  yarn infisical push staging --file=.env.infisical

Default --file is .env.local (project root).
  Pass --raw to send the file unchanged (no dotenv rewrite).`);
    process.exit(1);
  }

  if (tokens[0].startsWith("-")) {
    console.error(
      "Specify the environment first, e.g. yarn infisical push production"
    );
    process.exit(1);
  }

  const slug = mapEnvAlias(tokens[0]);
  const rest = tokens.slice(1);
  let filePath = path.join(root, ".env.local");
  /** Skip dotenv normalization (pass file through as-is). */
  let rawFile = false;
  const forwarded = [];

  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === "--file" && rest[i + 1]) {
      filePath = path.resolve(root, rest[++i]);
      continue;
    }
    if (t.startsWith("--file=")) {
      filePath = path.resolve(root, t.slice("--file=".length));
      continue;
    }
    if (t === "--raw") {
      rawFile = true;
      continue;
    }
    forwarded.push(t);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    process.exit(1);
  }

  let uploadPath = filePath;
  let tempFile = null;
  if (!rawFile) {
    try {
      tempFile = buildInfisicalSafeEnvFile(filePath);
      uploadPath = tempFile;
    } catch (e) {
      console.error(e.message || e);
      process.exit(1);
    }
  }

  const result = spawnSync(
    bin,
    ["secrets", "set", `--file=${uploadPath}`, `--env=${slug}`, ...forwarded],
    {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    }
  );

  if (tempFile) {
    try {
      fs.unlinkSync(tempFile);
    } catch {
      /* ignore */
    }
  }

  return result;
}

const args = process.argv.slice(2);

if (args[0] === "pull") {
  const result = runPullSubcommand(args);
  process.exit(result.status === null ? 1 : result.status);
}

const bin = getInfisicalBinPath();

if (!bin) {
  console.error(
    "Infisical CLI binary not found under node_modules/@infisical/cli/bin. Run: yarn install"
  );
  process.exit(1);
}

if (args[0] === "push") {
  const result = runPushSubcommand(args, bin);
  process.exit(result.status === null ? 1 : result.status);
}

const result = spawnSync(bin, args, {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
