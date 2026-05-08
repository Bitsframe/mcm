# Infisical — quick start for developers

Use this after you have **access to the team Infisical workspace** and the repo includes the shared **`scripts/`** helpers and **`package.json`** entries (your lead will add the same set to every project).

### Team setup (infra we use)

- **Infisical Cloud — US region** — [app.infisical.com](https://app.infisical.com). Managed SaaS by Infisical (**not** self-hosted, **not** EU cloud for our team).
- The Infisical **CLI** is installed with the repo as **`@infisical/cli`** (`yarn install`); for **US cloud** you do **not** set region flags—the CLI defaults to the US API.

---

## One-time on your machine

1. Clone the repo and install deps: **`yarn install`**. This installs **`@infisical/cli`** from `package.json` into `node_modules` (no global Infisical install required unless you want one).
2. Log in to **our Infisical org on US Cloud** (opens browser or prompts):  
   **`yarn infisical login`**  
   **No extra URL or domain config** — we use the default US cloud endpoint only. Ignore CLI docs about `INFISICAL_API_URL` / `--domain` unless you personally use EU Infisical or a self-hosted instance elsewhere.
3. **`.infisical.json` in the repo** — see the next section. Most of the time this file is **already committed**; you clone and you’re done.

---

## `.infisical.json` — when do you need to do anything?

That file **links this codebase to one Infisical project** (IDs only—no secrets inside).

| You are… | What to do |
|----------|------------|
| **Cloning a team repo that already has `.infisical.json`** | **Nothing.** It’s in git; run `yarn dev` after login. |
| **Adding only the script template** (`templates/infisical-dev-bundle/`) to a project **without** that file yet | You must get **`.infisical.json`** in the root **one time**, using **one** of: **(A)** copy it from another repo your lead says shares the same secrets, or **(B)** run **`yarn infisical init`** when the team **tells you which Infisical project to pick** (e.g. “select **Project X**”). |

**Why we say “don’t run `init` on your own”**  
`init` asks you to choose an Infisical project. The **wrong** project = wrong secrets for the app. So: **don’t guess.** Either use the committed file, copy an approved `.infisical.json`, or run **`init` only when your lead says to** and they tell you **which project** to select.

**Templates don’t include `.infisical.json`** on purpose: each app might point at a **different** Infisical project, or you copy the JSON from an existing repo after the team agrees.

---

## Commands you’ll use most

| Command | What it does |
|--------|----------------|
| `yarn dev` | Runs the app with secrets **injected from Infisical** (preferred for local dev). |
| `yarn dev:local` | Runs the app **without** Infisical (only env vars already on disk / shell). |
| `yarn build:infisical` | Production-style build with Infisical-injected env (when scripts are wired this way). |
| `yarn infisical pull` | Download secrets from Infisical into **`.env.local`** (interactive: pick dev / staging / production). |
| `yarn infisical pull production` | Same as pull, but **Production** (`prod`) only, no menu. |
| `yarn infisical pull development` | Pull **Development** (`dev`). |
| `yarn infisical pull staging` | Pull **Staging** env. |
| `yarn env:pull` | Same export tool as `pull` (alias / script entry). |
| `yarn infisical push production` | Upload **`.env.local`** to Infisical **Production** (updates cloud secrets). |
| `yarn infisical push development` | Upload **`.env.local`** to **Development**. |
| `yarn infisical push staging` | Upload to **Staging**. |
| `yarn infisical push production --file=.env.other` | Push a different file instead of `.env.local`. |
| `yarn infisical push production --raw` | Push file as-is (skip internal `.env` normalization). |

Friendly names map to Infisical **slugs**: e.g. `production` → `prod`, `development` → `dev`. If your project uses a custom slug, use that slug with `--env` on the underlying CLI or ask the team.

**Upstream Infisical CLI** (anything not listed above):  
`yarn infisical <args>` forwards to the real CLI, e.g. `yarn infisical secrets`, `yarn infisical export`, etc.

---

## Files to know about

| File | Role |
|------|------|
| `.infisical.json` | Links the repo to an Infisical project (safe to commit; no secret values). |
| `.env.local` | Local secrets file—**gitignored**. Often created/updated by `pull`. Do **not** commit. |
| `.gitignore` | Keeps `.env*` / local env files out of git—leave as-is. |

---

## Rules of thumb

- **`yarn dev`** = secrets from Infisical; no need to `pull` first unless you want a `.env.local` for tooling/IDE.
- **`yarn infisical pull …`** = refresh `.env.local` from the cloud copy.
- **`yarn infisical push …`** = push your local file **into** Infisical (affects the whole team for that environment—be careful on **production**).
- **Deployed sites** (Vercel, etc.) do **not** auto-update when you change Infisical—your team’s process (sync integration or redeploy) still applies.

---

## If something breaks

- **“Injecting 0 secrets”** / empty pull: wrong Infisical **environment** for where the secrets live—check **`defaultEnvironment`** in `.infisical.json` or pass the right env in the UI/CLI.
- **“Refresh token not found”** (Supabase): clear **cookies / site data** for `localhost` and log in again (stale session).
- **`infisical` not found in PowerShell**: use **`yarn infisical ...`** from the repo (no global install required).

For questions about **which Infisical environment** this app uses in production vs staging, ask the team lead.

---

## Copy this setup into another repo

The folder **`templates/infisical-dev-bundle/`** contains **`scripts/`** and **`package-json.merge.json`** to paste into other projects. That folder’s **`README.md`** only lists those files and install order—**all policies and commands are in this document** so we don’t maintain two copies.

If someone receives **only** the bundle (no monorepo clone), give them a copy of **`docs/INFISICAL_TEAM_SETUP.md`** (or your internal wiki page) so they still have the full guide, including **`.infisical.json`** rules.
