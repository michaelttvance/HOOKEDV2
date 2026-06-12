interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.warn("[emails] Skipping send — missing RESEND_API_KEY", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: false, error: "email_not_configured" };
  }

  const from = input.from ?? "Hooked <mike@hookaidashboard.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.reply_to ? { reply_to: input.reply_to } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[emails] Resend gateway error", res.status, body);
      return { ok: false, error: `gateway_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[emails] Send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

type OwnerAlertInput = {
  surface: string;
  route?: string;
  operation?: string;
  error: unknown;
  note?: string;
};

const OWNER_ALERT_RECIPIENT = "michaelttvance@gmail.com";
const OWNER_ALERT_TTL_MS = 10 * 60 * 1000;
const ownerAlertCache = new Map<string, number>();

function sanitizeAlertText(value: string): string {
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[redacted-phone]")
    .replace(/https?:\/\/[^\s)]+/gi, "[redacted-url]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "[redacted-id]",
    )
    .replace(/\b(?:eyJ[a-zA-Z0-9._-]+|sb_[A-Za-z0-9_-]+|sk_[A-Za-z0-9_-]+|pk_[A-Za-z0-9_-]+|rk_[A-Za-z0-9_-]+)\b/g, "[redacted-token]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function summarizeError(error: unknown): { type: string; summary: string } {
  if (error instanceof Error) {
    return {
      type: error.name || "Error",
      summary: sanitizeAlertText(error.message || "Unknown error"),
    };
  }

  if (typeof error === "string") {
    return { type: "Error", summary: sanitizeAlertText(error || "Unknown error") };
  }

  try {
    return {
      type: "Error",
      summary: sanitizeAlertText(JSON.stringify(error) || "Unknown error"),
    };
  } catch {
    return { type: "Error", summary: "Unknown error" };
  }
}

export function ownerAlertEmail(args: {
  timestamp: string;
  environment: string;
  surface: string;
  route: string;
  operation: string;
  errorType: string;
  summary: string;
  fingerprint: string;
  note?: string;
}) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.text};">Critical app error</h1>
    <p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:1.6;">Hooked hit a site-disturbing error that should be reviewed.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${brand.border};border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      ${alertRow("Timestamp", escape(args.timestamp))}
      ${alertRow("Environment", escape(args.environment))}
      ${alertRow("Surface", escape(args.surface))}
      ${alertRow("Route", escape(args.route))}
      ${alertRow("Operation", escape(args.operation))}
      ${alertRow("Error type", escape(args.errorType))}
      ${alertRow("Summary", escape(args.summary))}
      ${alertRow("Fingerprint", escape(args.fingerprint))}
      ${args.note ? alertRow("Notes", escape(args.note)) : ""}
    </table>
    <p style="margin:0;color:${brand.muted};font-size:13px;line-height:1.6;">
      This alert intentionally omits stack traces, tokens, customer data, and media URLs.
      Please check logs and the app surface for the full internal details.
    </p>
  `);
}

function alertRow(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:${brand.muted};font-size:13px;width:130px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:${brand.text};font-size:14px;line-height:1.5;">${value}</td></tr>`;
}

export async function sendOwnerAlert(input: OwnerAlertInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const { type, summary } = summarizeError(input.error);
  const fingerprint = [
    input.surface,
    input.route ?? "",
    input.operation ?? "",
    type,
    summary,
  ]
    .join("|")
    .toLowerCase();

  const now = Date.now();
  const lastSent = ownerAlertCache.get(fingerprint);
  if (lastSent && now - lastSent < OWNER_ALERT_TTL_MS) {
    console.warn("[alerts] Suppressed duplicate owner alert", {
      surface: input.surface,
      route: input.route ?? null,
      operation: input.operation ?? null,
      errorType: type,
    });
    return { ok: true, skipped: true };
  }

  ownerAlertCache.set(fingerprint, now);

  const sent = await sendEmail({
    to: OWNER_ALERT_RECIPIENT,
    from: "Hooked Alerts <alerts@hookaidashboard.com>",
    subject: `[Hooked] Critical app error — ${input.surface}`,
    html: ownerAlertEmail({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
      surface: input.surface,
      route: input.route ?? "—",
      operation: input.operation ?? "—",
      errorType: type,
      summary,
      fingerprint,
      note: input.note,
    }),
  });

  if (!sent.ok) {
    console.error("[alerts] Owner alert send failed", {
      surface: input.surface,
      route: input.route ?? null,
      operation: input.operation ?? null,
      errorType: type,
      reason: sent.error,
    });
  }

  return sent;
}

// ---- Branded templates ----

const brand = {
  bg: "#0b0f1a",
  card: "#111827",
  text: "#e5e7eb",
  muted: "#9ca3af",
  border: "#1f2937",
  primary: "#3b82f6",
  success: "#16a34a",
  danger: "#dc2626",
};

function shell(inner: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${brand.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${brand.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:${brand.card};border:1px solid ${brand.border};border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid ${brand.border};">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:${brand.primary};border-radius:8px;display:inline-block;text-align:center;line-height:32px;color:#fff;font-weight:700;">H</div>
            <span style="font-size:18px;font-weight:600;color:${brand.text};vertical-align:middle;">Hooked</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px;">${inner}</td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${brand.border};color:${brand.muted};font-size:12px;">
          Hooked · <a href="mailto:support@hookaidashboard.com" style="color:${brand.muted};">support@hookaidashboard.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function adminNotificationEmail(args: {
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  phone: string | null;
  signedUpAt: Date;
  approveUrl: string;
  rejectUrl: string;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:${brand.muted};font-size:13px;width:130px;">${label}</td><td style="padding:6px 0;color:${brand.text};font-size:14px;">${value}</td></tr>`;
  return shell(`
    <h1 style="margin:0 0 8px;font-size:20px;color:${brand.text};">New Hooked Signup Request</h1>
    <p style="margin:0 0 20px;color:${brand.muted};font-size:14px;">Review the details below and approve or reject the account.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${brand.border};border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      ${row("Name", escape(args.applicantName))}
      ${row("Email", escape(args.applicantEmail))}
      ${row("Company", escape(args.companyName))}
      ${row("Phone", escape(args.phone ?? "—"))}
      ${row("Submitted", args.signedUpAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))}
    </table>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:8px;">
        <a href="${args.approveUrl}" style="display:inline-block;background:${brand.success};color:#fff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;">Approve</a>
      </td>
      <td>
        <a href="${args.rejectUrl}" style="display:inline-block;background:${brand.danger};color:#fff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;">Reject</a>
      </td>
    </tr></table>
    <p style="margin:24px 0 0;color:${brand.muted};font-size:12px;">Or manage approvals at <a href="https://hookaidashboard.com/admin" style="color:${brand.primary};">hookaidashboard.com/admin</a>.</p>
  `);
}

export function approvedEmail(args: { name: string }) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.text};">You're approved!</h1>
    <p style="margin:0 0 20px;color:${brand.text};font-size:15px;line-height:1.6;">Hi ${escape(args.name)}, your Hooked account is ready. Log in to start dispatching jobs.</p>
    <a href="https://hookaidashboard.com" style="display:inline-block;background:${brand.primary};color:#fff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;">Log in to Hooked</a>
    <p style="margin:24px 0 0;color:${brand.muted};font-size:13px;">Questions? Reply to this email or contact support@hookaidashboard.com.</p>
  `);
}

export function rejectedEmail(args: { name: string }) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:20px;color:${brand.text};">Thank you for your interest in Hooked</h1>
    <p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:1.6;">Hi ${escape(args.name)}, we aren't able to approve your account at this time.</p>
    <p style="margin:0;color:${brand.muted};font-size:14px;">Questions? Email <a href="mailto:support@hookaidashboard.com" style="color:${brand.primary};">support@hookaidashboard.com</a>.</p>
  `);
}

// ---- Qualification application templates ----

export function applicationConfirmationEmail(args: { name: string; businessName: string }) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.text};">Thanks for applying to Hooked</h1>
    <p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:1.6;">Hi ${escape(args.name)},</p>
    <p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:1.6;">We received your Hooked application for <strong>${escape(args.businessName)}</strong>. We'll review it and get back to you within 24 hours.</p>
    <p style="margin:0 0 16px;color:${brand.text};font-size:14px;line-height:1.6;">Questions in the meantime? Email <a href="mailto:support@hookaidashboard.com" style="color:${brand.primary};">support@hookaidashboard.com</a> and we'll be happy to help.</p>
    <p style="margin:0;color:${brand.muted};font-size:13px;">— The Hooked Team</p>
  `);
}

export function applicationNotificationEmail(a: {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  cityState: string;
  truckCount: string;
  currentSoftware: string;
  softwareComplaints?: string;
  heardFrom: string;
  biggestChallenge?: string;
  billingPreference: string;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:${brand.muted};font-size:13px;width:160px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:${brand.text};font-size:14px;">${value}</td></tr>`;
  return shell(`
    <h1 style="margin:0 0 8px;font-size:20px;color:${brand.text};">New Hooked Application</h1>
    <p style="margin:0 0 20px;color:${brand.muted};font-size:14px;">${escape(a.businessName)} — ${escape(a.cityState)}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${brand.border};border-radius:8px;padding:12px 16px;margin-bottom:8px;">
      ${row("Name", escape(a.fullName))}
      ${row("Business", escape(a.businessName))}
      ${row("Email", `<a href="mailto:${escape(a.email)}" style="color:${brand.primary};">${escape(a.email)}</a>`)}
      ${row("Phone", escape(a.phone))}
      ${row("Location", escape(a.cityState))}
      ${row("Trucks", escape(a.truckCount))}
      ${row("Current software", escape(a.currentSoftware))}
      ${row("Software pain", escape(a.softwareComplaints || "—"))}
      ${row("Heard from", escape(a.heardFrom))}
      ${row("Biggest challenge", escape(a.biggestChallenge || "—"))}
      ${row("Billing", escape(a.billingPreference))}
    </table>
    <p style="margin:20px 0 0;color:${brand.muted};font-size:12px;">Review at <a href="https://hookaidashboard.com/admin" style="color:${brand.primary};">hookaidashboard.com/admin</a>.</p>
  `);
}

export function applicationInviteEmail(args: {
  name: string;
  businessName: string;
  signupUrl: string;
}) {
  return shell(`
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.text};">You're approved for Hooked</h1>
    <p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:1.6;">Hi ${escape(args.name)}, we'd love to onboard <strong>${escape(args.businessName)}</strong>. Click below to create your account and start your <strong>30-day free trial</strong> — full access to the dispatch board, driver app, billing, and AI assistant, no credit card required.</p>
    <a href="${args.signupUrl}" style="display:inline-block;background:${brand.primary};color:#0b0f1a;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;">Create my account</a>
    <p style="margin:20px 0 0;color:${brand.muted};font-size:13px;">Questions? Reply to this email and Mike will get back to you.</p>
  `);
}

// ---- Account statement template ----

export function statementEmail(args: {
  companyName: string;
  accountName: string;
  month: string;
  opening: number;
  charges: number;
  payments: number;
  balance: number;
  lines: Array<{
    date: string;
    customer: string;
    jobType: string;
    amount: number;
    invoice: string;
    paid: boolean;
  }>;
}) {
  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rows = args.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid ${brand.border};color:${brand.muted};font-size:12px;">${escape(l.date)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid ${brand.border};color:${brand.text};font-size:13px;">${escape(l.invoice)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid ${brand.border};color:${brand.text};font-size:13px;">${escape(l.customer)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid ${brand.border};color:${brand.muted};font-size:13px;">${escape(l.jobType)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid ${brand.border};color:${l.paid ? brand.success : brand.text};font-size:13px;text-align:right;font-family:monospace;">${fmt(l.amount)}${l.paid ? " ✓" : ""}</td>
      </tr>`,
    )
    .join("");
  const summary = (label: string, value: string, accent?: boolean) => `
    <tr>
      <td style="padding:6px 0;color:${brand.muted};font-size:13px;">${label}</td>
      <td style="padding:6px 0;color:${accent ? brand.primary : brand.text};font-size:14px;text-align:right;font-family:monospace;font-weight:${accent ? 700 : 400};">${value}</td>
    </tr>`;
  return shell(`
    <h1 style="margin:0 0 4px;font-size:22px;color:${brand.text};">Statement — ${escape(args.month)}</h1>
    <p style="margin:0 0 20px;color:${brand.muted};font-size:14px;">${escape(args.companyName)} → ${escape(args.accountName)}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${brand.border};border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      ${summary("Opening balance", fmt(args.opening))}
      ${summary("Charges this period", fmt(args.charges))}
      ${summary("Payments received", fmt(-args.payments))}
      ${summary("Balance due", fmt(args.balance), true)}
    </table>
    ${rows.length ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${brand.border};border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <thead><tr style="background:${brand.bg};">
        <th style="padding:8px 6px;text-align:left;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Date</th>
        <th style="padding:8px 6px;text-align:left;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Invoice</th>
        <th style="padding:8px 6px;text-align:left;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Customer</th>
        <th style="padding:8px 6px;text-align:left;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Service</th>
        <th style="padding:8px 6px;text-align:right;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>` : `<p style="color:${brand.muted};font-size:13px;">No activity this period.</p>`}
    <p style="margin:0;color:${brand.muted};font-size:13px;">Questions? Reply to this email and we'll get right back to you.</p>
  `);
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
