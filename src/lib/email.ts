import "server-only";

/**
 * Email service — intentionally small and provider-agnostic.
 * Swap `send()` internals to change providers; templates stay put.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const FROM = process.env.EMAIL_FROM || "Boba Bash Workshops <onboarding@resend.dev>";

async function send(payload: EmailPayload): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev/preview fallback: log instead of failing the request.
    console.info(`[email:dev] → ${payload.to} | ${payload.subject}`);
    return { delivered: false, error: "RESEND_API_KEY not configured (logged to console)" };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (result.error) {
      console.error("[email] resend error:", result.error);
      return { delivered: false, error: result.error.message };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { delivered: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

/* ── Branded layout ─────────────────────────────────────── */

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f0e9d8;font-family:Poppins,Segoe UI,Arial,sans-serif;color:#3d2b18;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9d8;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:0 8px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:#a9d8ee;border:2px solid #274156;border-radius:999px;padding:10px 24px;">
        <span style="font-family:'Baloo 2',Poppins,sans-serif;font-weight:700;font-size:18px;color:#274156;">🧋 ${title}</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#fbf6e8;border:2px solid #3d2b18;border-radius:12px;padding:28px;box-shadow:4px 4px 0 rgba(0,0,0,0.08);">
    <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
    ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td style="background:#f2c14e;border:2px solid #3d2b18;border-radius:8px;">
      <a href="${cta.url}" style="display:inline-block;padding:12px 28px;font-family:'Baloo 2',Poppins,sans-serif;font-weight:700;font-size:16px;color:#3d2b18;text-decoration:none;">${cta.label}</a>
    </td></tr></table>` : ""}
  </td></tr>
  <tr><td style="padding:18px 8px;text-align:center;font-size:12px;color:#9a8064;">
    Boba Bash Workshops · <a href="${appUrl}" style="color:#6b5842;">${appUrl.replace(/^https?:\/\//, "")}</a><br/>
    You received this email because you registered for a workshop.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;font-size:13px;color:#6b5842;width:120px;">${label}</td><td style="padding:6px 0;font-size:15px;font-weight:600;">${value}</td></tr>`;
}

/* ── Email templates ────────────────────────────────────── */

export type WorkshopEmailInfo = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  format: string;
  location: string | null;
  meetingUrl: string | null;
  organizationName: string;
  slug: string;
};

function fmt(startsAt: Date, endsAt: Date): string {
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-US", { timeZone: "Asia/Karachi", ...o });
  return `${f(startsAt, { weekday: "long", month: "long", day: "numeric" })} · ${f(startsAt, { hour: "numeric", minute: "2-digit" })} – ${f(endsAt, { hour: "numeric", minute: "2-digit" })} (PKT)`;
}

export async function sendRegistrationConfirmation(
  to: string,
  workshop: WorkshopEmailInfo,
  attendeeUrl: string,
) {
  const body =
    p(`You're in! Your spot at <strong>${workshop.title}</strong> is confirmed. 🎉`) +
    p(`We've saved your seat — no account needed. Keep this email; your personal link below lets you view the workshop, get the meeting link, or cancel anytime.`) +
    `<table role="presentation" width="100%" style="background:#f0e9d8;border-radius:8px;border:1px solid #e0d5bc;margin:8px 0 4px;">` +
    `<tr>${detail("When", fmt(workshop.startsAt, workshop.endsAt))}${detail("Format", workshop.format === "ONLINE" ? "Online" : `In person — ${workshop.location ?? "TBA"}`)}</tr>` +
    `<tr>${detail("Hosted by", workshop.organizationName)}${detail("Details", "workshop page")}</tr></table>` +
    p(`Meeting link coming soon? We'll email you the moment it's added.`);

  return send({
    to,
    subject: `You're registered: ${workshop.title}`,
    html: layout("You're going!", body, { label: "View my workshop", url: attendeeUrl }),
    text: `You're registered for ${workshop.title} — ${fmt(workshop.startsAt, workshop.endsAt)} (PKT). Manage your spot: ${attendeeUrl}`,
  });
}

export async function sendMeetingLinkAdded(to: string, workshop: WorkshopEmailInfo, attendeeUrl: string) {
  const body =
    p(`The meeting link for <strong>${workshop.title}</strong> is now available!`) +
    p(`Open your personal workshop page to join. The button below takes you straight there.`) +
    `<table role="presentation" width="100%" style="background:#f0e9d8;border-radius:8px;border:1px solid #e0d5bc;margin:8px 0 4px;"><tr>${detail("When", fmt(workshop.startsAt, workshop.endsAt))}</tr></table>`;
  return send({
    to,
    subject: `Meeting link is live: ${workshop.title}`,
    html: layout("Link's ready 🎉", body, { label: "Open my workshop", url: attendeeUrl }),
    text: `The meeting link for ${workshop.title} is now available: ${attendeeUrl}`,
  });
}

export async function sendReminder(to: string, workshop: WorkshopEmailInfo, attendeeUrl: string) {
  const body =
    p(`<strong>${workshop.title}</strong> starts tomorrow — get excited!`) +
    p(workshop.meetingUrl
      ? p(`It's online. Your join link is ready on your workshop page.`)
      : p(workshop.format === "ONLINE"
          ? `It's online — the meeting link will appear on your workshop page.`
          : `It's in person at <strong>${workshop.location ?? "the venue"}</strong>. See you there!`)) +
    `<table role="presentation" width="100%" style="background:#f0e9d8;border-radius:8px;border:1px solid #e0d5bc;margin:8px 0 4px;"><tr>${detail("When", fmt(workshop.startsAt, workshop.endsAt))}</tr></table>`;
  return send({
    to,
    subject: `Tomorrow: ${workshop.title}`,
    html: layout("See you tomorrow!", body, { label: "Open my workshop", url: attendeeUrl }),
    text: `Reminder: ${workshop.title} starts tomorrow. Details: ${attendeeUrl}`,
  });
}

export async function sendCancellation(to: string, workshop: WorkshopEmailInfo) {
  const body =
    p(`Heads up — <strong>${workshop.title}</strong> has been <strong>cancelled</strong> by the organizer. We're sorry to miss you!`) +
    p(`Keep an eye on the workshops page for upcoming sessions from ${workshop.organizationName}. Your registration has been removed — no action needed.`);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return send({
    to,
    subject: `Cancelled: ${workshop.title}`,
    html: layout("Workshop cancelled", body, { label: "Browse workshops", url: `${appUrl}/workshops` }),
    text: `${workshop.title} has been cancelled. Browse other workshops: ${appUrl}/workshops`,
  });
}

export async function sendRescheduled(to: string, workshop: WorkshopEmailInfo, attendeeUrl: string) {
  const body =
    p(`<strong>${workshop.title}</strong> has been <strong>moved</strong> to a new time:`) +
    `<table role="presentation" width="100%" style="background:#f0e9d8;border-radius:8px;border:1px solid #e0d5bc;margin:8px 0 4px;"><tr>${detail("New time", fmt(workshop.startsAt, workshop.endsAt))}${detail("Format", workshop.format === "ONLINE" ? "Online" : `In person — ${workshop.location ?? "TBA"}`)}</tr></table>` +
    p(`Your registration carries over automatically — nothing to do.`);
  return send({
    to,
    subject: `Rescheduled: ${workshop.title}`,
    html: layout("Time change ⏰", body, { label: "View new time", url: attendeeUrl }),
    text: `${workshop.title} has been rescheduled to ${fmt(workshop.startsAt, workshop.endsAt)} (PKT). Details: ${attendeeUrl}`,
  });
}

/** Used by the "resend my access link" flow. */
export async function sendAccessLinks(
  to: string,
  items: { title: string; url: string; startsAt: Date }[],
) {
  const list = items
    .map(
      (i) =>
        `<li style="margin-bottom:10px;"><a href="${i.url}" style="color:#274156;font-weight:600;">${i.title}</a><br/><span style="font-size:13px;color:#6b5842;">${i.startsAt.toLocaleString("en-US", { timeZone: "Asia/Karachi", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} PKT</span></li>`,
    )
    .join("");
  const body =
    p(`Here are your secure workshop links. Each link is personal — don't share it.`) +
    `<ul style="margin:0 0 14px;padding-left:20px;">${list}</ul>`;
  return send({
    to,
    subject: "Your Boba Bash workshop links",
    html: layout("Your workshop links", body),
    text: items.map((i) => `${i.title}: ${i.url}`).join("\n"),
  });
}
