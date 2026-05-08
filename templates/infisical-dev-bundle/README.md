# Infisical dev bundle (files only)

This directory is **not** a second manual. The full guide is a single doc:

**→ [`docs/INFISICAL_TEAM_SETUP.md`](../../docs/INFISICAL_TEAM_SETUP.md)** (in this repo)

That document covers login, **`.infisical.json` policy**, every `yarn` command, and troubleshooting.

---

## What you do with this folder

1. Copy **`scripts/`** into the target app root (next to `package.json`).
2. Merge **`package-json.merge.json`** into that app’s **`package.json`** (adjust `next dev` / `next build` if you don’t use Next.js).
3. Add **`dotenv`** if missing; add **`cross-env`** if you use `build:infisical` and don’t have it.
4. **`yarn install`** → **`yarn infisical login`**.
5. **`.infisical.json`:** follow **“.infisical.json — when do you need to do anything?”** in the team doc (copy from an approved repo, or `init` only when the lead names the Infisical project).

---

## Contents

| Path | Purpose |
|------|--------|
| `scripts/resolve-infisical-bin.cjs` | Resolves `infisical.exe` on Windows. |
| `scripts/infisical-run.cjs` | `yarn infisical`, `pull`, `push`, CLI passthrough. |
| `scripts/fetch-infisical-env.cjs` | `yarn env:pull` / export to `.env.local`. |
| `package-json.merge.json` | Snippet to merge into `package.json`. |

**If you only have this zip** and not the rest of the repo, ask your lead for the same content as **`INFISICAL_TEAM_SETUP.md`**, or an internal wiki link.

## Updating scripts

When the canonical scripts change in the main repo, replace these `scripts/` files from **`templates/infisical-dev-bundle/scripts/`** there.
