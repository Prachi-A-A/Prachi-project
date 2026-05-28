# Word Scramble — okta L&D

Finance L&D warm-up game with Okta SSO and a leaderboard.

- **Frontend**: Next.js 15 (App Router, TypeScript)
- **Auth**: NextAuth.js v5 (Auth.js) with Okta OIDC provider
- **DB**: Vercel Postgres
- **Hosting**: Vercel

Built to handle 800+ players on free tiers with comfortable headroom.

---

## Deployment guide

This is a real deploy with a few moving pieces. Plan for **30–60 minutes of your time**, plus **1–3 business days** waiting on Okta IT for the OIDC app registration.

### Step 1 — Have Okta IT register an OIDC app (do this first, longest pole)

You need an Okta admin to register a new OIDC application for this game. Send them this:

> **Hi [Okta admin],**
>
> I'm building a small internal Word Scramble game for the finance L&D program (Q3 2026). I need an OIDC app registered so employees can sign in via Okta and post scores to a leaderboard. ~800 expected users, internal-only.
>
> **App configuration:**
> - **Application type:** OIDC — Web Application
> - **Sign-in redirect URI:** `https://YOUR-APP-NAME.vercel.app/api/auth/callback/okta`
>   *(I'll send you the final URL after I deploy. Use a placeholder for now.)*
> - **Sign-out redirect URI:** `https://YOUR-APP-NAME.vercel.app`
> - **Grant types:** Authorization Code, Refresh Token
> - **Assignments:** All Okta employees (or scope to whatever group makes sense for finance L&D)
>
> **What I need back:**
> - Client ID
> - Client Secret
> - Okta Issuer URL (e.g. `https://okta.okta.com/oauth2/default`)
>
> Thank you!

Once they finish, you'll have three values: **Client ID**, **Client Secret**, **Issuer URL**. Save them somewhere secure.

### Step 2 — Push this code to GitHub

```bash
cd scramble-game
git init
git add .
git commit -m "scramble game initial commit"
gh repo create okta-finance-scramble --private --source=. --push
```

(Or do it via the GitHub UI if you don't have `gh` CLI.)

### Step 3 — Deploy to Vercel

1. Go to https://vercel.com/new
2. Import the `okta-finance-scramble` repo
3. Framework preset: Next.js (auto-detected)
4. Click **Deploy** — first deploy will fail (env vars missing), that's OK
5. Note your deployment URL (something like `okta-finance-scramble.vercel.app`)

### Step 4 — Send the final URL to Okta IT

Now that you have the real URL, send it to your Okta admin so they can update the redirect URI:

- Sign-in redirect: `https://okta-finance-scramble.vercel.app/api/auth/callback/okta`
- Sign-out redirect: `https://okta-finance-scramble.vercel.app`

### Step 5 — Add Vercel Postgres

In your Vercel project:

1. Go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Pick the closest region
4. Click **Create**, then **Connect** to your project
5. This auto-populates the `POSTGRES_*` env vars

### Step 6 — Add the rest of the env vars

In Vercel project → **Settings** → **Environment Variables**, add:

| Key | Value |
|---|---|
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the output |
| `AUTH_URL` | `https://YOUR-APP-NAME.vercel.app` (your Vercel URL) |
| `AUTH_OKTA_ID` | Client ID from Okta IT |
| `AUTH_OKTA_SECRET` | Client Secret from Okta IT |
| `AUTH_OKTA_ISSUER` | Issuer URL from Okta IT |

Apply to **Production**, **Preview**, **Development**.

### Step 7 — Redeploy

Vercel → Deployments → click the latest → **Redeploy**.

After this builds successfully, the database schema will auto-create on the first API request — but you can also trigger it manually:

```bash
# pull env vars locally
vercel env pull .env.local

# init db
npm install
npm run init-db
```

### Step 8 — Smoke-test

1. Visit your URL
2. Click **Sign in with Okta**
3. Authenticate with your Okta account
4. Play a round, submit a score
5. Confirm your score shows on the leaderboard

You're live. Share the URL.

---

## Local development

```bash
npm install
cp .env.example .env.local
# fill in AUTH_OKTA_* values + AUTH_SECRET
# pull POSTGRES_* from Vercel: vercel env pull .env.local
npm run dev
```

Open http://localhost:3000.

---

## Architecture notes

- **Score validation** (`src/app/api/scores/route.ts`): rejects payloads where score > `wordsSolved * 16`. Caps prevent client-side tampering.
- **Identity** is the email from the Okta ID token — clients can't fake this.
- **Leaderboard** shows each user's *best* score across all plays (`MAX(score) GROUP BY email`), not every attempt.
- **Schema auto-create** runs on every API request via `ensureSchema()`. Cheap (uses `IF NOT EXISTS`), avoids a separate migration step.
- **Indexes**: `(score DESC)` for top-N queries, `(email)` for per-user lookups.
- **Free tier capacity**: Vercel hobby = 100GB bandwidth, Postgres free = 60h compute, 256MB storage. 800 players × ~10 plays = well under all limits.

## Known limits / future work

- No rate limiting yet — add Vercel KV + a sliding window if abuse becomes a concern.
- Leaderboard is global. If you want per-team or per-event boards, add a `cohort` column and filter.
- No analytics on hint/skip use — could add for L&D learning insights.
- Game is currently 12 fixed words. Easy to expand: edit `WORDS` array in `src/components/Game.tsx`.

## File map

```
scramble-game/
├── package.json, tsconfig.json, next.config.mjs   ← project config
├── .env.example                                   ← env template
├── README.md                                      ← this file
├── scripts/init-db.mjs                            ← one-time DB setup
└── src/
    ├── app/
    │   ├── layout.tsx                             ← root layout, fonts
    │   ├── page.tsx                               ← server component (game + leaderboard)
    │   ├── globals.css                            ← all styles
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts        ← NextAuth handlers
    │       └── scores/route.ts                    ← GET leaderboard, POST submit
    ├── components/
    │   ├── Game.tsx                               ← client game component
    │   ├── Leaderboard.tsx                        ← server-rendered leaderboard
    │   └── SignInGate.tsx                         ← unauthenticated landing
    ├── lib/
    │   ├── auth.ts                                ← NextAuth config (Okta provider)
    │   └── db.ts                                  ← Postgres queries
    └── auth.d.ts                                  ← session type extensions
```
