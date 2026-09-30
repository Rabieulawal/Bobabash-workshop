const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const appUrl = BASE.replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${appUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE = {
  name: "Boba Bash Workshops",
  shortName: "Boba Bash",
  tagline: "Live online workshops, meetups & community events — Lahore and beyond.",
  description:
    "Browse and join free online workshops by Boba Bash Lahore and partner events. No account needed — enter your email and your private access link appears instantly.",
  url: appUrl,
};
