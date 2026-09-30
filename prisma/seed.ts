/**
 * Seed script — creates demo data for development/staging.
 *
 * Development credentials (LOCAL DEV ONLY — never use these in production):
 *   Super Admin  admin    / $SEED_SUPER_ADMIN_PASSWORD (default: admin-dev-password)
 *   Organizer    fatima   / organizer-dev-password
 *   Organizer    bilal    / organizer-dev-password
 *   Manager      ayesha   / manager-dev-password
 *
 * Production: read DEPLOYMENT.md §6 before running this against a live DB.
 * In production, always set SEED_SUPER_ADMIN_PASSWORD and delete it from
 * your env after seeding; organizer passwords can then be rotated by each
 * user at /admin/account or by an admin via "Reset password".
 */
import { PrismaClient, WorkshopStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 86_400_000;
function at(daysFromNow: number, hour: number, minute = 0): Date {
  // Compose a Lahore-local wall clock time (UTC+5, no DST).
  const base = new Date(Date.now() + daysFromNow * DAY);
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const d = base.getUTCDate();
  return new Date(Date.UTC(y, m, d, hour - 5, minute));
}

async function main() {
  console.log("Seeding…");
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "admin-dev-password";
  if (process.env.NODE_ENV === "production" && password === "admin-dev-password") {
    console.error("Refusing to seed production with the default admin password.");
    console.error("Set SEED_SUPER_ADMIN_PASSWORD to a long random value first.");
    process.exit(1);
  }

  const adminHash = await hash(password, 12);
  const orgHash = await hash("organizer-dev-password", 12);
  const mgrHash = await hash("manager-dev-password", 12);

  // Organizations ──────────────────────────────────────────
  const bobaBash = await prisma.organization.upsert({
    where: { slug: "boba-bash-lahore" },
    update: {},
    create: {
      name: "Boba Bash Lahore",
      slug: "boba-bash-lahore",
      description: "The original boba-fueled community — workshops, meetups and good vibes in Lahore.",
      isFeatured: true,
      status: "ACTIVE",
    },
  });

  const lcc = await prisma.organization.upsert({
    where: { slug: "lahore-coding-club" },
    update: {},
    create: {
      name: "Lahore Coding Club",
      slug: "lahore-coding-club",
      description: "Community-run coding workshops for students and professionals.",
      status: "ACTIVE",
    },
  });

  const aim = await prisma.organization.upsert({
    where: { slug: "lahore-ai-meetup" },
    update: {},
    create: {
      name: "Lahore AI Meetup",
      slug: "lahore-ai-meetup",
      description: "Hands-on AI/ML sessions, demos and discussions.",
      status: "ACTIVE",
    },
  });

  // Organizers ─────────────────────────────────────────────
  const admin = await prisma.organizer.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash, active: true, role: "SUPER_ADMIN" },
    create: { name: "Super Admin", username: "admin", passwordHash: adminHash, role: "SUPER_ADMIN", active: true },
  });

  const fatima = await prisma.organizer.upsert({
    where: { username: "fatima" },
    update: {},
    create: {
      name: "Fatima Khan",
      username: "fatima",
      passwordHash: orgHash,
      role: "ORGANIZER",
      organizationId: bobaBash.id,
      mustChangePassword: true,
    },
  });

  const bilal = await prisma.organizer.upsert({
    where: { username: "bilal" },
    update: {},
    create: {
      name: "Bilal Ahmed",
      username: "bilal",
      passwordHash: orgHash,
      role: "ORGANIZER",
      organizationId: lcc.id,
      mustChangePassword: true,
    },
  });

  const ayesha = await prisma.organizer.upsert({
    where: { username: "ayesha" },
    update: {},
    create: {
      name: "Ayesha Malik",
      username: "ayesha",
      passwordHash: mgrHash,
      role: "WORKSHOP_MANAGER",
      organizationId: aim.id,
      mustChangePassword: true,
    },
  });

  // Workshops ──────────────────────────────────────────────
  // All workshops are online — a meeting link is optional and can be added later.
  type W = {
    slug: string; title: string; description: string; startsAt: Date; endsAt: Date;
    meetingUrl?: string; capacity?: number;
    status: WorkshopStatus; orgId: string; organizerId: string;
  };

  const workshops: W[] = [
    {
      slug: "boba-brewing-101",
      title: "Boba Brewing 101",
      description:
        "Learn the art of bubble tea from scratch! We'll cover tea selection, brewing times, tapioca pearl preparation, and classic recipes.\n\nJoin live from your kitchen and brew along — no experience needed.",
      startsAt: at(2, 17), endsAt: at(2, 19),
      meetingUrl: "https://meet.google.com/bobabash-brewing",
      capacity: 24, status: "PUBLISHED", orgId: bobaBash.id, organizerId: fatima.id,
    },
    {
      slug: "latte-art-for-beginners",
      title: "Latte Art for Beginners",
      description:
        "From milk steaming basics to your first heart and rosetta, with live demos from our favourite baristas.\n\nLimited spots — register early!",
      startsAt: at(5, 18), endsAt: at(5, 20),
      meetingUrl: "https://zoom.us/j/bobabash-latte-art",
      capacity: 16, status: "PUBLISHED", orgId: bobaBash.id, organizerId: fatima.id,
    },
    {
      slug: "community-mixer-december",
      title: "Community Mixer: Meet the Organizers",
      description:
        "A relaxed online hangout to meet the people behind Boba Bash Lahore, hear what's coming next, and share your workshop ideas.",
      startsAt: at(7, 20), endsAt: at(7, 21),
      meetingUrl: "https://meet.google.com/bobabash-demo",
      status: "PUBLISHED", orgId: bobaBash.id, organizerId: fatima.id,
    },
    {
      slug: "web-dev-crash-course",
      title: "Web Dev Crash Course: HTML → React",
      description:
        "A fast-paced, beginner-friendly tour of modern web development. Build and deploy your first interactive app by the end of the session.\n\nPrerequisites: curiosity. That's it.",
      startsAt: at(3, 16), endsAt: at(3, 18, 30),
      meetingUrl: "https://zoom.us/j/lcc-demo",
      capacity: 60, status: "PUBLISHED", orgId: lcc.id, organizerId: bilal.id,
    },
    {
      slug: "git-github-hands-on",
      title: "Git & GitHub Hands-On",
      description:
        "Branching, merging, pull requests and good commit hygiene — everything you need to contribute to open source with confidence.",
      startsAt: at(10, 17), endsAt: at(10, 19),
      meetingUrl: "https://zoom.us/j/lcc-git-hands-on",
      capacity: 30, status: "PUBLISHED", orgId: lcc.id, organizerId: bilal.id,
    },
    {
      slug: "intro-to-llms",
      title: "Intro to LLMs: Build Your First AI App",
      description:
        "What actually happens inside a large language model? Then: build a tiny AI-powered app live with an API. Bring a laptop!",
      startsAt: at(6, 19), endsAt: at(6, 21),
      meetingUrl: undefined, // "coming soon" demo
      capacity: 100, status: "PUBLISHED", orgId: aim.id, organizerId: ayesha.id,
    },
    {
      slug: "prompt-engineering-clinic",
      title: "Prompt Engineering Clinic",
      description:
        "Bring your gnarliest prompts. We'll debug them together and learn patterns that make model outputs reliable.",
      startsAt: at(14, 18), endsAt: at(14, 19, 30),
      meetingUrl: "https://teams.microsoft.com/l/meetup-join/aim-demo",
      capacity: 40, status: "PUBLISHED", orgId: aim.id, organizerId: ayesha.id,
    },
    {
      slug: "boba-tasting-night",
      title: "Boba Tasting Night (Fully Booked)",
      description: "A guided tasting of eight signature drinks over a live video session. This one filled up fast — join the next one!",
      startsAt: at(1, 19), endsAt: at(1, 21),
      meetingUrl: "https://meet.google.com/bobabash-tasting",
      capacity: 20, status: "FULLY_BOOKED", orgId: bobaBash.id, organizerId: fatima.id,
    },
    {
      slug: "mystery-workshop-tba",
      title: "Mystery Workshop (Coming Soon)",
      description: "We can't announce it yet… but it involves tapioca and a very large pot. Keep an eye on this page.",
      startsAt: at(21, 17), endsAt: at(21, 19),
      status: "DRAFT", orgId: bobaBash.id, organizerId: fatima.id,
    },
  ];

  const created: Record<string, { id: string }> = {};
  for (const w of workshops) {
    const saved = await prisma.workshop.upsert({
      where: { slug: w.slug },
      update: {},
      create: {
        slug: w.slug,
        title: w.title,
        description: w.description,
        startsAt: w.startsAt,
        endsAt: w.endsAt,
        meetingUrl: w.meetingUrl,
        capacity: w.capacity,
        status: w.status,
        organizationId: w.orgId,
        organizerId: w.organizerId,
      },
    });
    created[w.slug] = saved;
  }

  // Registrations ──────────────────────────────────────────
  const demoEmails = [
    "ali.dev@example.com", "sana.k@example.com", "hamza@example.com",
    "zara@example.com", "usman.dev@example.com", "mariam@example.com",
  ];

  const targets: { slug: string; count: number; fillTo?: number }[] = [
    { slug: "boba-brewing-101", count: 3 },
    { slug: "boba-tasting-night", count: 0, fillTo: 20 }, // fills capacity → FULLY_BOOKED
    { slug: "web-dev-crash-course", count: 6 },
    { slug: "intro-to-llms", count: 4 },
    { slug: "git-github-hands-on", count: 2 },
    { slug: "prompt-engineering-clinic", count: 1 },
    { slug: "community-mixer-december", count: 2 },
  ];

  const { randomBytes } = await import("crypto");
  let emailIdx = 0;
  for (const t of targets) {
    const workshop = created[t.slug];
    if (!workshop) continue;
    const count = t.fillTo ?? t.count;
    for (let i = 0; i < count; i++) {
      const email = demoEmails[emailIdx % demoEmails.length] + (emailIdx >= demoEmails.length ? `.r${Math.floor(emailIdx / demoEmails.length)}` : "");
      emailIdx++;
      const tokenHash = randomBytes(32).toString("hex");
      await prisma.registration.upsert({
        where: { workshopId_attendeeEmail: { workshopId: workshop.id, attendeeEmail: email } },
        update: {},
        create: {
          workshopId: workshop.id,
          attendeeEmail: email,
          status: "CONFIRMED",
          secureTokenHash: tokenHash,
          tokenExpiresAt: new Date(Date.now() + 30 * DAY),
        },
      }).catch(() => {
        // duplicate email in same workshop — skip
      });
    }
  }

  console.log("Seed complete.");
  console.log("──────────────────────────────────────────────");
  console.log("Development logins (username / password):");
  console.log(`  admin    / ${password}`);
  console.log("  fatima   / organizer-dev-password");
  console.log("  bilal    / organizer-dev-password");
  console.log("  ayesha   / manager-dev-password");
  console.log("──────────────────────────────────────────────");
  console.log("Super admin id:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
