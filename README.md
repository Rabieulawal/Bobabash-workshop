# 🧋 Boba Bash Workshops

A community workshop platform for **Boba Bash Lahore** and partner events. **Every workshop is online.** Attendees register with just an email — no accounts — and receive their private access link **immediately in the browser**. Organizers get a full dashboard to create and manage workshops. The platform sends **no email at all**.

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
| Attendee access | Passwordless token minted at registration, shown in the browser instantly |
| Email | **None** — the app has no email provider, templates or cron |
| File storage | **None** — static assets only (`public/`); no Blob/S3/Cloudinary/UploadThing |
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
   # or: npm run gen:env → creates a starter .env for you
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
- `/workshops` — all workshops; filters: today / tomorrow / this week, per-organization; sort: soonest / most popular / recently added
- `/workshops/[slug]` — detail page with **I'm Going** registration, capacity display (`23 / 40 going`), **Fully booked** state, **Join Workshop** button when a meeting link exists, JSON-LD structured data (`OnlineEventAttendanceMode`)
- `/boba-bash-lahore`, `/other-events`, `/[orgSlug]` — per-organization pages
- `/my/[token]` — passwordless attendee page: workshop info, **Join Workshop**, cancel registration

**Registration is the delivery channel.** There is no confirmation email: the moment an attendee registers, the success card shows their private `/my/<token>` link with a **Copy** button and an **Open my workshop** action. Re-submitting the same email for the same workshop re-issues a fresh link instead of locking them out.

### Organizer experience (`/admin`)
- Username/password login, forced password change on first login
- Dashboard: upcoming/total workshops, total registrations, registrations this week, workshop table
- Create/edit **online** workshops (draft → publish lifecycle), reschedule, meeting-link management (add, replace or remove), close/reopen registration, cancel workshop (preserves registrations), delete drafts
- Attendee list per workshop with timestamps + **Export CSV**

### Super Admin (`/admin`)
- Organizers: create, edit, reset password (revokes sessions), enable/disable
- Organizations: create/edit, featured (Boba Bash ecosystem) vs partner
- Registrations: platform-wide searchable list with unique-email stats
- Platform overview: full statistics + system status (database, hosting, timezone)

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
- Attendee tokens: `crypto.randomBytes`, hashed at rest, 30-day expiry, never expose DB IDs
- Zod validation on every input; **https-only** URL validation for meeting links and cover images
- DB-backed rate limiting: registration 8/5min/IP, login 10/5min/IP (registration throttling also covers access-link re-issue)
- Unique constraint `(workshopId, attendeeEmail)` + backend capacity checks
- Uniform login failures; draft workshops invisible publicly; organizer scoping on every query

**Design note (no-email tradeoff):** because there is no email delivery, the access link is issued to the browser that registers (or re-registers) with a given email address — there is no out-of-band verification. Registration is rate-limited per IP, tokens are hashed at rest with a 30-day expiry, and no database IDs are ever exposed. If stronger identity assurance is ever required, add an external auth/verification provider rather than reintroducing email.

## Database schema (Prisma)

`Organization`, `Organizer`, `Workshop`, `Registration`, `Session`, `RateLimit` — see `prisma/schema.prisma`. Workshops have no format/location fields (all online) and registrations have no email-delivery bookkeeping. Migrations live in `prisma/migrations/`.

## Attendee access (no email)

1. Attendee submits their email on a workshop page.
2. The server creates/updates the registration, mints a 24-byte random token with `crypto.randomBytes`, stores only its SHA-256 hash + expiry, and returns the URL.
3. The browser immediately renders the copyable `/my/<token>` link plus a **Join Workshop** action once the organizer has added a meeting link.

Lost the link? Register again with the same email on the workshop page — the same registration is reused (no duplicate row, no capacity double-count) and a fresh link is issued. Workshops that are **fully booked or have registration closed** show an **Already registered?** form that does the same lookup without creating anything new, so a lost link is never a lockout.

## Project structure

```
src/
  app/                 # App Router pages + server actions + route handlers
    admin/             #   dashboards, workshops, organizers, organizations…
    workshops/         #   public discovery + registration actions
    my/[token]/        #   passwordless attendee page
    api/               #   health, CSV export
  components/
    ui/                # shadcn-style primitives (themed)
    workshops/ admin/  # feature components
  lib/                 # auth, db, validation, permissions, ratelimit…
prisma/                # schema, migrations, seed
public/                # static brand assets (cup.png, logos/) — no uploads
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
| `npm run gen:env` | Write a starter local `.env` |

## Environment variables

Only two, both required in production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon **pooled** on Vercel) |
| `NEXT_PUBLIC_APP_URL` | Public base URL (used in metadata and attendee access links) |

Sessions and attendee tokens are random 24–32 byte values stored only as SHA-256 hashes, so no signing secret is needed. No email, cron or storage variables exist — there is nothing else to configure.

## Deploying & everyday use

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — full step-by-step: Neon setup, environment variables, migrations, production seeding, Vercel import, and connecting `workshops.bobabashlahore.xyz`.
- **[USAGE.md](USAGE.md)** — day-to-day manual: who does what, where passwords are stored, maintenance cheat-sheet, troubleshooting.
