# 📖 Usage Guide

Everything you need to actually **run** Boba Bash Workshops day-to-day. For architecture see [README.md](README.md); for the host setup see [DEPLOYMENT.md](DEPLOYMENT.md).

**Two things to remember:**

1. **All workshops are online.** There is no venue, address or format field anywhere.
2. **The platform sends no email.** Attendees get their private access link in the browser the moment they register.

---

## 1. Getting started checklist (first run)

```bash
npm install
cp .env.example .env        # or: npm run gen:env (writes a starter .env)
# → edit .env and set DATABASE_URL (see below)
npx prisma migrate dev      # create tables
npm run db:seed             # demo orgs, workshops, registrations + the 4 dev logins
npm run dev                 # open http://localhost:3000
```

**What to put in `.env` locally:**

| Variable | What to do |
|---|---|
| `DATABASE_URL` | Local Postgres: `postgresql://postgres:PASSWORD@localhost:5432/boba_workshops` · Neon: the **pooled** connection string from their dashboard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; the real domain in production |

There is nothing else to configure — no email keys, no cron secret, no storage credentials.

## 2. Where passwords live (and in what form)

**Passwords are never stored in readable form anywhere** — not in the database, not in code, not in logs.

| What | Where it's stored | In what form |
|---|---|---|
| Organizer passwords | `Organizer.passwordHash` column in the `Organizer` table (PostgreSQL) | **bcrypt hash, cost factor 12** — one-way; even with full DB access you can't read the original password |
| Login sessions | `Session` table + `bb_session` HTTP-only cookie in the organizer's browser | cookie holds a random token; DB stores only its SHA-256 hash, with an expiry date |
| Attendee access links | `Registration.secureTokenHash` in the `Registration` table | random token shown to the attendee in the browser; DB stores only the SHA-256 hash + `tokenExpiresAt` |

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
2. Open a workshop → type your email → **I'm Going**.
3. **The success card appears immediately** with your private access link (`/my/<token>`) — use **Copy** to save it or **Open my workshop** to go there now. Nothing is emailed; this is the only way back, so bookmark it.
4. On that page you can: see the schedule, use **Join Workshop** once the organizer adds the meeting link, or cancel your registration.
5. Lost the link? Open the workshop page again and register with the same email — the same registration is reused and a **fresh link is issued instantly**.

### 🧋 Organizer (e.g. `fatima`)
1. `/admin/login` → username + password → **change your password immediately** when prompted.
2. **Dashboard** shows your upcoming workshops and registration counts.
3. **New workshop** → fill in details (there is no venue/format field — every workshop is online) → save as **Draft** first if you want to review, then edit → Status **Published**.
4. On the workshop's manage page:
   - **Meeting link** — paste a Google Meet/Zoom/Teams/Discord (or any `https://`) URL whenever it's ready. The public page and every attendee's access page immediately show a **Join Workshop** button. Clear the field to remove the link.
   - **Reschedule** — change date/time; the new time is live immediately on the public page and on attendees' access pages.
   - **Close registration** / **Reopen** — pause signups without cancelling.
   - **Attendees** — the full list with an **Export CSV** button (opens in Excel/Sheets).
   - **Cancel workshop** — marks it cancelled and blocks new sign-ups, keeps attendee records.
5. You only ever see **your own** workshops; you can't touch other organizers' data.

### 🛡 Super Admin (`admin`)
- Everything an organizer can do, plus:
- **Organizers** — create accounts (name, username, initial password, organization, role). Share the password through a secure channel; the user is forced to change it at first login. Reset passwords, disable accounts (instantly signs them out), grant extra permissions.
- **Organizations** — add partner orgs ("Lahore Coding Club" etc.). They automatically appear under **Other Events**. One org is flagged *featured* — that's the Boba Bash card on the homepage.
- **Registrations** — search every registration platform-wide by email.
- **Platform overview** (Settings) — platform stats and system status (database, hosting, timezone).

## 4. Attendee access without email

There is no email queue and no "resend my link" page — the browser *is* the delivery channel.

**How it works:** when someone registers, the server creates the registration, mints a random 24-byte token (`crypto.randomBytes`), stores only its SHA-256 hash with a 30-day expiry, and returns the `/my/<token>` URL to the page that submitted the form. That page shows the link with a copy button.

**If an attendee loses their link:**
- They simply register again on the same workshop page with the same email. The existing registration is reused (no duplicate row, no extra seat counted) and a brand-new link is issued. Registration is rate-limited per IP (8 attempts / 10 minutes), which also throttles link re-issue attempts.
- If the workshop is **fully booked or registration is closed**, the page shows an **Already registered? → Get my access link** form. It only looks up an existing registration, so it can't sneak anyone past capacity; an unknown email gets a neutral "No confirmed registration found".
- Removing a workshop from the site (or cancelling it) invalidates nothing about their link — it still resolves, but shows the cancelled/closed state.

## 5. Demo data & cleaning it up

The seed creates 3 organizations, 4 users, 9 online workshops (including a draft, a fully-booked one, and one with no meeting link yet) and ~38 fake registrations using `@example.com` addresses (a reserved domain kept purely as demo data — no mail is ever sent to them).

To remove demo data after going live: log in as admin and delete the workshops you don't want (or edit `prisma/seed.ts` first and re-run on a fresh DB). Demo registrations disappear together with their workshop. Keep: *Boba Bash Lahore* org (it's the featured homepage card) and your real user accounts.

## 6. Maintenance cheat-sheet

| Task | How |
|---|---|
| Apply schema changes in prod | edit `prisma/schema.prisma` → `npx prisma migrate dev` locally (creates migration) → commit → `npx prisma migrate deploy` against prod DB → deploy |
| Add an organizer | Admin → Organizers → **New organizer** |
| Rotate a forgotten password | Admin → Organizers → 🔑 icon |
| Attendee lost their link | Nothing to do — they re-register with the same email on the workshop page and get a fresh link instantly |
| Replace a workshop's meeting link | Admin → workshop → **Meeting link** panel → paste the new URL → Save (leaving it empty removes the link) |
| Fully remove a workshop | Cancel it if people registered (keeps records); only drafts with 0 registrations show a **Delete** option |
| Check system health | `https://your-domain/api/health` → `{"status":"ok","db":"up"}` |

## 7. Troubleshooting

| Symptom | Cause & fix |
|---|---|
| "Invalid username or password" but you're sure | Passwords are hashed — nobody can read them. Reset via another admin or the SQL above. |
| Attendee says the link expired | Links last 30 days. They re-register on the workshop page for a fresh one — no admin action needed. |
| Workshop invisible on the public site | It's a **Draft** (or registration closed/cancelled). Drafts are hidden by design. |
| "Fully booked" but you want more seats | Edit the workshop → raise **Maximum attendees**. The status recomputes automatically. |
| No **Join Workshop** button on a workshop | The organizer hasn't saved a meeting link yet. Add one in the **Meeting link** panel. |
| Attendee says they never got an email | Correct — the platform sends no email. Their access link was shown in the browser at registration and they can re-register to get a new one. |
