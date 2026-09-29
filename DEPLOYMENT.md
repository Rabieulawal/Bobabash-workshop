# 🚀 Deploying Boba Bash Workshops to Vercel

Production URL: **`workshops.bobabashlahore.xyz`**

The app is a standard Next.js App Router project — it deploys to Vercel with **zero custom infrastructure**: no Docker, no always-on server, no filesystem persistence. All state lives in PostgreSQL.

---

## 1. Create the PostgreSQL database (Neon)

1. Sign up at [neon.tech](https://neon.tech) → **Create project** (pick a region close to your users).
2. Open the project **Dashboard → Connection Details**.
3. Copy the **pooled** connection string (it contains `-pooler.` in the host) — serverless functions should use pooling:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep the **direct** (non-pooled) string handy too — use it for `prisma migrate deploy` if you hit connection limits.

## 2. Push the repository to GitHub

```bash
git init
git add -A
git commit -m "Boba Bash Workshops — initial release"
git remote add origin git@github.com:YOUR_ORG/boba-bash-workshops.git
git push -u origin main
```

## 3. Import the project into Vercel

1. [vercel.com/new](https://vercel.com/new) → import the `boba-bash-workshops` repo.
2. Framework preset: **Next.js** (auto-detected). Build command / output: defaults.
3. Do **not** deploy yet — add environment variables first (next step).

## 4. Configure environment variables (Vercel → Settings → Environment Variables)

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** connection string | used by the app at runtime |
| `AUTH_SECRET` | `openssl rand -base64 48` | session token derivation |
| `CRON_SECRET` | `openssl rand -hex 24` | protects `/api/cron/send-reminders` |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) | omit to log emails to console |
| `EMAIL_FROM` | `Boba Bash Workshops <no-reply@bobabashlahore.xyz>` | must be a verified Resend sender |
| `NEXT_PUBLIC_APP_URL` | `https://workshops.bobabashlahore.xyz` | used in emails & metadata |

Add them to **Production, Preview and Development** environments. Never commit real secrets to git.

## 5. Run Prisma migrations

From your machine (with `DATABASE_URL` pointing at Neon):

```bash
# in .env locally (NOT committed):
DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require"

npx prisma migrate deploy
```

Or run it in CI. Vercel's build (`next build`) does **not** run migrations — apply them before/with each deploy.

## 6. Seed production data — carefully

⚠️ **Do not seed production with the dev credentials.** Two safe options:

**Option A — minimal bootstrap (recommended):** temporarily set
```
SEED_SUPER_ADMIN_PASSWORD="a-long-random-password"
ALLOW_PRODUCTION_SEED="true"
```
then run `npm run db:seed`, and **remove both variables immediately after**. The seed also creates the demo organizations and sample workshops — delete any you don't want from the admin UI (or edit `prisma/seed.ts` before running).

**Option B — admin-only start:** skip seeding entirely and create the first organizer directly against the DB:
```bash
npx prisma studio   # or insert via SQL with a bcrypt hash
```
Then create all other organizers from the Super Admin UI (`/admin/organizers`), which forces each of them to change their password on first login.

## 7. Deploy

Click **Deploy** (or `vercel --prod`). Every push to `main` now deploys automatically: **GitHub → Vercel → Build → Production**.

## 8. Connect `workshops.bobabashlahore.xyz`

1. Vercel project → **Settings → Domains → Add** → `workshops.bobabashlahore.xyz`.
2. At your DNS provider (where `bobabashlahore.xyz` is hosted) add the record Vercel shows — for a subdomain that's typically:
   ```
   CNAME  workshops  →  cname.vercel-dns.com
   ```
3. Wait for DNS propagation; Vercel issues and renews the TLS certificate automatically.

## 9. Verify HTTPS

Open `https://workshops.bobabashlahore.xyz` — confirm the padlock, no mixed-content warnings, and that `http://` redirects to `https://` (Vercel does this by default).

## 10–12. Post-deploy smoke tests

1. **Public registration:** open any published workshop → enter an email → **I'm Going** → success state; the email arrives (or is console-logged if Resend isn't configured yet). Re-submitting the same email → "already registered".
2. **Organizer login:** `/admin/login` → log in → change password at `/admin/account` → create a workshop → add a meeting link → verify it on the public page.
3. **Admin permissions:** log in as an Organizer and visit `/admin/organizers` → you should be bounced to `/admin?error=forbidden`. Log in as Super Admin → manage organizers/organizations.
4. **Health check:** `https://workshops.bobabashlahore.xyz/api/health` → `{"status":"ok","db":"up"}`.

## 13. Reminders cron

`vercel.json` ships with a daily cron:
```
0 13 * * *  →  GET /api/cron/send-reminders
```
(13:00 UTC = 18:00 PKT). Vercel automatically sends `Authorization: Bearer $CRON_SECRET`. It emails attendees of tomorrow's workshops. On hobby plans you may need to enable cron usage in project settings; on Pro it runs by default.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `P1001 can't reach database` | Check `DATABASE_URL`, Neon host, `?sslmode=require` |
| Emails not arriving | Verify `RESEND_API_KEY` + `EMAIL_FROM` is a verified domain; check Vercel function logs for `[email]` errors |
| 401 on `/api/cron/send-reminders` | `CRON_SECRET` env var mismatch (or missing Authorization header from a manual call) |
| Workshop page 404 after creation | It's probably still a **Draft** — publish it from the manage page |
| Middleware/domain issues | Confirm `NEXT_PUBLIC_APP_URL` matches the final domain exactly (no trailing slash) |
