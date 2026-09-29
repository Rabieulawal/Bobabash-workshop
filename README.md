# 🧋 Boba Bash Workshops

A community workshop platform for **Boba Bash Lahore** and partner events. Attendees register with just an email — no accounts. Organizers get a full dashboard to create and manage workshops.

**Production target:** [`workshops.bobabashlahore.xyz`](https://workshops.bobabashlahore.xyz) on **Vercel**.

> 🎨 The design is built directly on the official Boba Bash branding guide (`index.html` in the repo root): bubble `#a9d8ee`, bubble-ink `#274156`, surface `#fbf6e8`, ink `#3d2b18`, goldenrod `#f2c14e`, Baloo 2 + Poppins, 2px borders with hard offset shadows and the signature speech-bubble pill.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript strict |
| Styling | Tailwind CSS + shadcn-style components with Boba Bash tokens |
| Database | PostgreSQL (Neon recommended) via Prisma ORM |
| Auth | Username/password (bcrypt, cost 12) + DB-backed HTTP-only cookie sessions |
| Email | Resend, abstracted behind `src/lib/email.ts` |
| Validation | Zod everywhere (forms, actions, route handlers) |
| Forms | React Hook Form patterns via `useActionState` + server actions |
| Icons | Lucide React |
| Hosting | Vercel (serverless — no always-on server, no filesystem writes) |

## Quick start (local)

1. **Prerequisites:** Node 20+, and a PostgreSQL database (local or Neon).

2. **Install & configure**
   ```bash
   npm install
   cp .env.example .env        # then fill in DATABASE_URL etc.
   # or: npm run gen:env  → creates .env with random AUTH_SECRET/CRON_SECRET
   ```

3. **Migrate, generate client & seed**
   ```bash
   npx prisma migrate dev      # applies prisma/migrations
   npm run db:seed             # demo organizations, workshops, registrations
   ```

4. **Run**
   ```bash
   npm run dev                 # http://localhost:3000
   ```

### Development logins (seeded — local only!)

| Username | Password | Role |
|---|---|---|
| `admin` | `admin-dev-password` | Super Admin |
| `fatima` | `organizer-dev-password` | Organizer (Boba Bash Lahore) |
| `bilal` | `organizer-dev-password` | Organizer (Lahore Coding Club) |
| `ayesha` | `manager-dev-password` | Workshop Manager (Lahore AI Meetup) |

Login at `/admin/login`. **Never use these credentials in production** — seed production with strong passwords or create organizers from the admin UI.

## What's inside

### Public (attendee) experience
- `/` — hero, **Boba Bash Lahore** vs **Other Events** entry cards, upcoming workshops with search/filters/sort
- `/workshops` — all workshops; filters: today / tomorrow / this week, online / in-person, per-organization; sort: soonest / most popular / recently added
- `/workshops/[slug]` — detail page with **I'm Going** email-only registration, capacity display (`23 / 40 going`), **Fully booked** state, **Join Workshop** button when a meeting link exists, JSON-LD structured data
- `/boba-bash-lahore`, `/other-events`, `/[orgSlug]` — per-organization pages
- `/my/[token]` — passwordless attendee page: workshop info, meeting link, cancel
- `/find-my-workshops` — re-email fresh secure links (no address enumeration)

### Organizer experience (`/admin`)
- Username/password login, forced password change on first login
- Dashboard: upcoming/total workshops, total registrations, registrations this week, workshop table
- Create/edit workshops (draft → publish lifecycle), reschedule with attendee emails, meeting-link management with optional notification, close/reopen registration, cancel workshop (preserves registrations + notifies attendees)
- Attendee list per workshop with timestamps + **Export CSV**

### Super Admin (`/admin`)
- Organizers: create, edit, reset password (revokes sessions), enable/disable
- Organizations: create/edit, featured (Boba Bash ecosystem) vs partner
- Registrations: platform-wide searchable list with unique-email stats
- Platform overview: full statistics + system status (email configured, cron, etc.)

### Roles & permissions
| | Super Admin | Organizer | Workshop Manager |
|---|---|---|---|
| Manage own workshops/attendees | ✓ | ✓ | ✓ |
| Manage ALL workshops/registrations | ✓ | — | — |
| Manage organizers / organizations / platform | ✓ | — | — |

Permissions are enforced **server-side** in every action & route handler (`src/lib/auth.ts` + `guardAction`). Additional roles can be added in one place (`ROLE_PERMISSIONS`).

## Security

- bcrypt (cost 12) password hashing; plaintext never stored
- HTTP-only, SameSite=Lax, Secure (prod) session cookies; tokens stored as SHA-256 hashes with expiry
- Attendee tokens: `crypto.randomBytes`, hashed at rest, expiring, never expose DB IDs
- Zod validation on every input; https-only URL validation for meeting/cover links
- DB-backed rate limiting: registration 8/5min/IP, login 10/5min/IP, resend-access 4/10min/IP
- Unique constraint `(workshopId, attendeeEmail)` + backend capacity checks
- Uniform login failures, no attendee-address enumeration, secret-protected cron endpoint
- Draft workshops invisible publicly; organizer scoping on every query

## Database schema (Prisma)

`Organization`, `Organizer`, `Workshop`, `Registration`, `Session`, `RateLimit` — see `prisma/schema.prisma`. Migrations live in `prisma/migrations/`.

## Emails (Resend)

Transactional emails: registration confirmation, secure access links, reminder (T-1 day via cron), meeting-link added, cancellation, rescheduling. Without `RESEND_API_KEY`, emails are logged to the console instead of failing. Templates live in `src/lib/email.ts`; swap the provider by editing that one file.

## Project structure

```
src/
  app/                 # App Router pages + server actions + route handlers
    admin/             #   dashboards, workshops, organizers, organizations…
    workshops/         #   public discovery + registration actions
    my/[token]/        #   passwordless attendee page
    api/               #   health, cron reminders, CSV export
  components/
    ui/                # shadcn-style primitives (themed)
    workshops/ admin/  # feature components
  lib/                 # auth, db, email, validation, permissions, ratelimit…
prisma/                # schema, migrations, seed
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript strict check |
| `npx prisma migrate dev` | Apply migrations (local) |
| `npx prisma migrate deploy` | Apply migrations (CI/prod) |
| `npm run db:seed` | Seed demo data |
| `npm run gen:env` | Generate local `.env` with random secrets |

## Deploying & everyday use

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — full step-by-step: Neon setup, environment variables, migrations, production seeding, Vercel import, and connecting `workshops.bobabashlahore.xyz`.
- **[USAGE.md](USAGE.md)** — day-to-day manual: who does what, where passwords are stored, Resend setup, maintenance cheat-sheet, troubleshooting.
