/**
 * Dev-only helper: generates .env with random AUTH_SECRET and CRON_SECRET.
 * Usage: bun run scripts/gen-env.ts
 */
import { writeFileSync, existsSync, readFileSync } from "fs";

const authSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64");
const cronSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("hex");

const env = `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boba_workshops?schema=public"
AUTH_SECRET="${authSecret}"
CRON_SECRET="${cronSecret}"
RESEND_API_KEY=""
EMAIL_FROM="Boba Bash Workshops <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOW_PRODUCTION_SEED="false"
`;

if (!existsSync(".env")) {
  writeFileSync(".env", env);
  console.log("Created .env with generated secrets.");
} else {
  const existing = readFileSync(".env", "utf-8");
  const missing = [
    ["AUTH_SECRET", authSecret],
    ["CRON_SECRET", cronSecret],
  ].filter(([k]) => !existing.includes(k));
  if (missing.length) {
    writeFileSync(".env", existing.trimEnd() + "\n" + missing.map(([k, v]) => `${k}="${v}"`).join("\n") + "\n");
    console.log("Appended missing keys to .env:", missing.map(([k]) => k).join(", "));
  } else {
    console.log(".env already exists and is complete.");
  }
}
