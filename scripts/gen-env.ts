/**
 * Dev-only helper: writes a starter .env for local development.
 * Usage: bun run scripts/gen-env.ts  (or: npm run gen:env)
 *
 * The app needs no secrets beyond the database URL: sessions and attendee
 * tokens are random values stored only as SHA-256 hashes, there is no email
 * provider and no file storage. See .env.example for the full list.
 */
import { writeFileSync, existsSync, readFileSync } from "fs";

const lines = [
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boba_workshops?schema=public"`,
  `NEXT_PUBLIC_APP_URL="http://localhost:3000"`,
];

if (!existsSync(".env")) {
  writeFileSync(".env", lines.join("\n") + "\n");
  console.log("Created .env — edit DATABASE_URL if your Postgres differs.");
} else {
  const existing = readFileSync(".env", "utf-8");
  const missing = lines.map((l) => l.split("=")[0]).filter((key) => !existing.includes(key));
  if (missing.length) {
    writeFileSync(".env", existing.trimEnd() + "\n" + lines.filter((l) => missing.includes(l.split("=")[0])).join("\n") + "\n");
    console.log("Appended missing keys to .env:", missing.join(", "));
  } else {
    console.log(".env already exists and is complete.");
  }
}
