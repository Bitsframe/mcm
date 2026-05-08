/**
 * Export secrets from the Infisical project linked by .infisical.json (infisical export).
 *
 * Usage:
 *   yarn infisical pull
 *   yarn infisical pull production
 *   node scripts/fetch-infisical-env.cjs
 *   node scripts/fetch-infisical-env.cjs --env=staging
 *   node scripts/fetch-infisical-env.cjs --no-interactive
 *   node scripts/fetch-infisical-env.cjs --out .env.staging
 *   node scripts/fetch-infisical-env.cjs --stdout
 *
 * Interactive (TTY): arrow keys to pick Development / Staging / Production.
 * Non-interactive: INFISICAL_ENV, else .infisical.json defaultEnvironment, else dev.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const prompts = require("prompts");
const { getInfisicalBinPath } = require("./resolve-infisical-bin.cjs");

const root = path.join(__dirname, "..");

/** Slugs must match Infisical environment slugs in Project settings. */
const ENV_CHOICES = [
  { title: "Development", value: "dev" },
  { title: "Staging", value: "staging" },
  { title: "Production", value: "prod" },
];

function getDefaultEnvSlug() {
  try {
    const cfgPath = path.join(root, ".infisical.json");
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    const slug = cfg.defaultEnvironment;
    if (slug != null && String(slug).trim() !== "") {
      return String(slug).trim();
    }
  } catch {
    /* no config */
  }
  return "dev";
}

function parseArgs() {
  /** @type {string | null} */
  let explicitEnv = null;
  /** @type {string | null} */
  let outFile = path.join(root, ".env.local");
  let stdoutOnly = false;
  let noInteractive = false;

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stdout") {
      stdoutOnly = true;
      outFile = null;
    } else if (a.startsWith("--env=")) {
      explicitEnv = a.slice("--env=".length).trim() || null;
    } else if (a === "--env" && argv[i + 1]) {
      explicitEnv = String(argv[++i]).trim() || null;
    } else if (a.startsWith("--out=")) {
      outFile = path.resolve(root, a.slice("--out=".length));
      stdoutOnly = false;
    } else if (a === "--out" && argv[i + 1]) {
      outFile = path.resolve(root, argv[++i]);
      stdoutOnly = false;
    } else if (a === "--no-interactive" || a === "-y") {
      noInteractive = true;
    } else if (a === "-h" || a === "--help") {
      console.log(`Usage: node scripts/fetch-infisical-env.cjs [options]

Options:
  --env <slug>       Infisical environment (skips the menu)
  --no-interactive, -y   Skip arrow-key menu; use INFISICAL_ENV or .infisical.json default or dev
  --out <file>       Write dotenv here (default: .env.local)
  --stdout           Print dotenv to stdout only
  -h, --help         Show this message

In a normal terminal, the script opens an interactive list (arrow keys + Enter).
Uses the project in .infisical.json at the repo root.`);
      process.exit(0);
    }
  }

  return { explicitEnv, outFile, stdoutOnly, noInteractive };
}

async function promptEnvSlug() {
  const def = getDefaultEnvSlug();
  let initial = ENV_CHOICES.findIndex((c) => c.value === def);
  if (initial < 0) {
    initial = 0;
  }

  const res = await prompts({
    type: "select",
    name: "slug",
    message: "Which Infisical environment?",
    choices: ENV_CHOICES.map((c) => ({ title: c.title, value: c.value })),
    initial,
  });

  if (res.slug === undefined) {
    process.exit(1);
  }
  return res.slug;
}

function resolveEnvSlug(parsed) {
  if (parsed.explicitEnv != null && String(parsed.explicitEnv).trim() !== "") {
    return String(parsed.explicitEnv).trim();
  }
  if (process.env.INFISICAL_ENV) {
    return process.env.INFISICAL_ENV;
  }
  if (parsed.noInteractive || !process.stdin.isTTY) {
    return getDefaultEnvSlug();
  }
  return null;
}

function runExport(bin, envSlug, outFile, stdoutOnly) {
  const args = ["export", "--format=dotenv", `--env=${envSlug}`];
  const spawnOpts = { cwd: root };
  if (stdoutOnly || !outFile) {
    const result = spawnSync(bin, args, {
      ...spawnOpts,
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
    });
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    if (result.status !== 0) {
      process.exit(result.status === null ? 1 : result.status);
    }
    process.stdout.write(result.stdout || "");
    const n = (result.stdout || "")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#")).length;
    console.error(`Exported ${n} non-empty lines to stdout (env=${envSlug})`);
  } else {
    const result = spawnSync(bin, [...args, `--output-file=${outFile}`], {
      ...spawnOpts,
      stdio: ["inherit", "inherit", "inherit"],
    });
    if (result.status !== 0) {
      process.exit(result.status === null ? 1 : result.status);
    }
    let lines = 0;
    try {
      const text = fs.readFileSync(outFile, "utf8");
      lines = text
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("#")).length;
    } catch {
      /* optional */
    }
    console.error(
      `Wrote Infisical secrets (${envSlug}) → ${path.relative(root, outFile)} (${lines} variables, approx.)`
    );
  }
}

(async () => {
  const bin = getInfisicalBinPath();
  if (!bin) {
    console.error("Infisical CLI not found. Run: yarn install");
    process.exit(1);
  }

  const parsed = parseArgs();
  let envSlug = resolveEnvSlug(parsed);
  if (envSlug === null) {
    envSlug = await promptEnvSlug();
  }

  runExport(bin, envSlug, parsed.outFile, parsed.stdoutOnly);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
