# 🚀 Deploying Boba Bash Workshops to Vercel

Production URL: **`workshops.bobabashlahore.xyz`**

The app is a standard Next.js App Router project — it deploys to Vercel with **zero custom infrastructure**: no Docker, no always-on server, no filesystem persistence, **no email provider and no file/object storage**. All state lives in PostgreSQL.

---

## 1. Create the PostgreSQL database (Neon)

1. Sign up at [neon.tech](https://neon.tech) → **Create project** (pick a region close to your users).
2. Open the project **Dashboard → Connection Details**.
3. Copy the **pooled** connection string (it contains `-pooler.` in the host) — serverless functions should use pooling:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep the **direct** (non-pooled) string handy too — use it for `prisma migrate deploy` if you hit connection limits.

PostgreSQL is the only data store: organizations, organizers, workshops, registrations, sessions and rate limits all live there.

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
| `NEXT_PUBLIC_APP_URL` | `https://workshops.bobabashlahore.xyz` | used in metadata & attendee access links |

Add them to **Production, Preview and Development** environments. Never commit real secrets to git.

That is the complete list: the app deliberately ships without **any** email, cron or storage variables. (If an older deployment of this project still defines keys for email delivery, reminders or file storage, they can safely be deleted — nothing in this codebase reads them.)

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
```
then run `npm run db:seed`, and **remove the variable immediately after**. The seed also creates the demo organizations and sample (online) workshops — delete any you don't want from the admin UI (or edit `prisma/seed.ts` before running).

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

1. **Public registration:** open any published workshop → enter an email → **I'm Going** → the success card immediately shows the private `/my/<token>` link with **Copy** and **Open my workshop**. No email is sent (there is no email provider). Re-submitting the same email re-issues a fresh link.
2. **Organizer login:** `/admin/login` → log in → change password at `/admin/account` → create an **online** workshop (there is no format or venue field) → add a meeting link → verify the **Join Workshop** button on the public page.
3. **Admin permissions:** log in as an Organizer and visit `/admin/organizers` → you should be bounced to `/admin?error=forbidden`. Log in as Super Admin → manage organizers/organizations.
4. **Health check:** `https://workshops.bobabashlahore.xyz/api/health` → `{"status":"ok","db":"up"}`.

## 13. What does *not* run in production

- No cron jobs (delete any legacy Vercel Cron entries — the repo no longer has a `vercel.json`).
- No email delivery, no email queue, no email templates.
- No file uploads or object storage — brand assets are committed under `public/` and served statically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `P1001 can't reach database` | Check `DATABASE_URL`, Neon host, `?sslmode=require` |
| Workshop page 404 after creation | It's probably still a **Draft** — publish it from the manage page |
| Attendee lost their access link | They re-register with the same email on the workshop page — the same registration is reused and a fresh link is issued (no admin action needed) |
| Middleware/domain issues | Confirm `NEXT_PUBLIC_APP_URL` matches the final domain exactly (no trailing slash) |
