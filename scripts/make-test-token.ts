/**
 * Dev helper: prints a valid attendee access URL for a registration.
 * Usage: bun run scripts/make-test-token.ts <email>
 */
import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mirrors createAttendeeToken() from src/lib/auth without the server-only import.
async function createAttendeeToken(registrationId: string, days = 30): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.registration.update({
    where: { id: registrationId },
    data: { secureTokenHash: tokenHash, tokenExpiresAt: new Date(Date.now() + days * 86_400_000) },
  });
  return token;
}

async function main() {
  const email = process.argv[2] ?? "ali.dev@example.com";
  const registration = await prisma.registration.findFirst({
    where: { attendeeEmail: email, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
  });
  if (!registration) {
    console.error("No confirmed registration found for", email);
    process.exit(1);
  }
  const token = await createAttendeeToken(registration.id);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
  console.log(`${base}/my/${token}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

