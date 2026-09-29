# 📖 Usage Guide

Everything you need to actually **run** Boba Bash Workshops day-to-day. For architecture see [README.md](README.md); for the host setup see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. Getting started checklist (first run)

```bash
npm install
cp .env.example .env        # or: npm run gen:env (creates .env with random secrets)
# → edit .env and set DATABASE_URL (see below)
npx prisma migrate dev      # create tables
npm run db:seed             # demo orgs, workshops, registrations + the 4 dev logins
npm run dev                 # open http://localhost:3000
```

**What to put in `.env` locally:**

| Variable | What to do |
|---|---|
| `DATABASE_URL` | Local Postgres: `postgresql://postgres:PASSWORD@localhost:5432/boba_workshops` · Neon: the **pooled** connection string from their dashboard |
| `AUTH_SECRET` | any long random string — `npm run gen:env` makes one for you |
| `RESEND_API_KEY` | leave empty while developing (emails are printed in the terminal instead of sent) |
| `EMAIL_FROM` | e.g. `Boba Bash Workshops <no-reply@bobabashlahore.xyz>` (must be a domain verified in Resend before it can actually deliver) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; the real domain in production |
| `CRON_SECRET` | any long random string (only matters on Vercel) |

**No `.env` value is a "placeholder" you need to replace in code** — everything configurable lives in environment variables. The only file with defaults is `.env.example`, which is meant to be copied.

## 2. Where passwords live (and in what form)

**Passwords are never stored in readable form anywhere** — not in the database, not in code, not in logs.

| What | Where it's stored | In what form |
|---|---|---|
| Organizer passwords | `Organizer.passwordHash` column in the `Organizer` table (PostgreSQL) | **bcrypt hash, cost factor 12** — one-way; even with full DB access you can't read the original password |
| Login sessions | `Session` table + `bb_session` HTTP-only cookie in the attendee's/organizer's browser | cookie holds a random token; DB stores only its SHA-256 hash, with an expiry date |
| Attendee access links | `Registration.secureTokenHash` in the `Registration` table | random token emailed to the attendee; DB stores only the SHA-256 hash + `tokenExpiresAt` |

What this means practically:

- If you forget the admin password you **can't look it up** — you reset it:
  - **Another admin exists:** they use *Organizers → key icon (Reset password)*, which sets a temporary password and signs the user out everywhere.
  - **You're locked out completely:** run this on the server (replace the hash by generating a new one with `node -e "require('bcryptjs').hash('YOUR-NEW-PASSWORD',12).then(console.log)"`):
    ```sql
    UPDATE "Organizer" SET "passwordHash" = '<paste-hash>', "mustChangePassword" = true WHERE username = 'admin';
    ```
- Passwords are set in exactly three places: the seed script (initial accounts), the Super Admin's "Create/Edit organizer" dialogs, and each user's own *My account → Update password* form. All three hash before saving.
- Changing your password at `/admin/account` also flips off the "temporary password" warning.

## 3. Who does what — the everyday workflows

### 👤 Attendee (no account, ever)
1. Open the site → pick **Boba Bash Lahore** or **Other Events** (or just browse).
2. Open a workshop → type your email → **I'm Going**. Done.
3. Check your inbox — the email contains your **personal link** (`/my/<token>`). Bookmark it; it's the only way back to your spot.
4. On that page you can: see the meeting link once it's added (**Join Workshop** button), or cancel your registration.

### 🧋 Organizer (e.g. `fatima`)
1. `/admin/login` → username + password → **change your password immediately** when prompted.
2. **Dashboard** shows your upcoming workshops and registration counts.
3. **New workshop** → fill in details → save as **Draft** first if you want to review, then edit → Status **Published**.
4. On the workshop's manage page:
   - **Meeting link** — paste a Google Meet/Zoom/Teams URL when it's ready; tick "Email attendees" to notify them. Until then the public page says "Meeting link: Coming soon".
   - **Reschedule** — change date/time; ticking "Email attendees" notifies everyone.
   - **Close registration** / **Reopen** — pause signups without cancelling.
   - **Attendees** — the full list with a **Export CSV** button (opens in Excel/Sheets).
   - **Cancel workshop** — marks it cancelled, emails attendees, keeps their records.
5. You only ever see **your own** workshops; you can't touch other organizers' data.

### 🛡 Super Admin (`admin`)
- Everything an organizer can do, plus:
- **Organizers** — create accounts (name, username, initial password, organization, role). Share the password through a secure channel; the user is forced to change it at first login. Reset passwords, disable accounts (instantly signs them out), grant extra permissions.
- **Organizations** — add partner orgs ("Lahore Coding Club" etc.). They automatically appear under **Other Events**. One org is flagged *featured* — that's the Boba Bash card on the homepage.
- **Registrations** — search every registration platform-wide by email.
- **Platform overview** (Settings) — stats + whether email is configured.

## 4. Email setup (Resend)

1. Create a free account at [resend.com](https://resend.com) → **API Keys** → create one.
2. **Domains → Add domain** → `bobabashlahore.xyz` → add the DNS records Resend shows (SPF/DKIM). This lets you send from `no-reply@bobabashlahore.xyz`.
3. Put `RESEND_API_KEY` + `EMAIL_FROM` in Vercel's environment variables and redeploy.

**Until then**, the app doesn't break — every email is printed to the server logs (visible in Vercel → Deployments → Functions logs) prefixed `[email:dev]`. Attendee links shown in those logs are clickable for testing.

Emails sent: registration confirmation (with personal link), meeting-link added, day-before reminder (automatic via Vercel Cron at 18:00 PKT daily), cancellation, rescheduling, and the "resend my links" recovery email.

## 5. Demo data & cleaning it up

The seed creates 3 organizations, 4 users, 9 workshops (including a draft, a fully-booked one, and a cancelled demo) and ~38 fake registrations using `@example.com` addresses. These are **safe**: `example.com` is a reserved domain that can't receive real email.

To remove demo data after going live: log in as admin and delete the workshops you don't want (or edit `prisma/seed.ts` first and re-run on a fresh DB). Demo registrations disappear together with their workshop. Keep: *Boba Bash Lahore* org (it's the featured homepage card) and your real user accounts.

## 6. Maintenance cheat-sheet

| Task | How |
|---|---|
| Apply schema changes in prod | edit `prisma/schema.prisma` → `npx prisma migrate dev` locally (creates migration) → commit → `npx prisma migrate deploy` against prod DB → deploy |
| Add an organizer | Admin → Organizers → **New organizer** |
| Rotate a forgotten password | Admin → Organizers → 🔑 icon |
| Re-send an attendee their link | They use **Find my workshops** at the bottom of the site (no admin action needed) |
| Fully remove a workshop | Cancel it if people registered (keeps records); only drafts with 0 registrations show a **Delete** option |
| Check system health | `https://your-domain/api/health` → `{"status":"ok","db":"up"}` |

## 7. Troubleshooting

| Symptom | Cause & fix |
|---|---|
| "Invalid username or password" but you're sure | Passwords are hashed — nobody can read them. Reset via another admin or the SQL above. |
| Emails not arriving | `RESEND_API_KEY` missing/wrong, or `EMAIL_FROM` domain not yet verified in Resend. Check the function logs for `[email] resend error`. |
| Workshop invisible on the public site | It's a **Draft** (or registration closed/cancelled). Drafts are hidden by design. |
| "Fully booked" but you want more seats | Edit the workshop → raise **Maximum attendees**. The status recomputes automatically. |
| Attendee's link says expired | Links expire after 30 days. They request a fresh one via **Find my workshops**. |
| Cron returns 401 | `CRON_SECRET` env var doesn't match what Vercel sends — re-set it and redeploy. |
