import type { Metadata } from "next";
import { SITE } from "@/lib/app-url";
import "@fontsource/host-grotesk/400.css";
import "@fontsource/host-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Boba Bash Lahore`,
    template: `%s · Boba Bash Workshops`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Boba Bash Lahore`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Boba Bash Lahore`,
    description: SITE.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-display antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
