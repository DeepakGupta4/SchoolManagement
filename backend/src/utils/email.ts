import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

/**
 * Outbound email.
 *
 * When SMTP credentials are configured (Gmail app-password in our case) mail is
 * sent for real. When they are NOT — local dev, or before the operator has set
 * them up — nothing is thrown: the message is logged to the console instead, so
 * the whole approval flow still works and the generated password is never lost.
 * Callers get `delivered: false` and can, for example, surface the credentials
 * in the admin UI as a fallback.
 */

/** Whether real email delivery is configured (Brevo HTTP API or SMTP). */
export function isEmailConfigured(): boolean {
  return Boolean((env.BREVO_API_KEY && senderEmail()) || (env.SMTP_USER && env.SMTP_PASS));
}

/** The verified "from" address. */
function senderEmail(): string | undefined {
  return env.MAIL_FROM_EMAIL || env.SMTP_USER;
}

/**
 * Send via Brevo's HTTPS API. Preferred in production because it needs no SMTP
 * ports (which hosts like Render block outright).
 */
async function sendViaBrevo(email: OutgoingEmail): Promise<{ delivered: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: env.MAIL_FROM_NAME || env.SOFTWARE_NAME, email: senderEmail() },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
    });
    if (res.ok) return { delivered: true };
    const body = await res.text().catch(() => "");
    return { delivered: false, error: `Brevo ${res.status}: ${body.slice(0, 300)}` };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      // Explicit host/port 587 (STARTTLS): many cloud hosts time out on the
      // default secure port 465, but allow 587.
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      // Gmail app passwords are shown with spaces ("abcd efgh …") but must be
      // sent without them — strip whitespace so either form works.
      auth: { user: env.SMTP_USER, pass: (env.SMTP_PASS ?? "").replace(/\s+/g, "") },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(
  email: OutgoingEmail
): Promise<{ delivered: boolean; error?: string }> {
  // Prefer the HTTP API — it works where SMTP ports are blocked.
  if (env.BREVO_API_KEY && senderEmail()) return sendViaBrevo(email);

  const t = getTransporter();

  if (!t) {
    console.log(
      `\n[email:console-fallback] SMTP not configured — would have sent:\n` +
        `  to:      ${email.to}\n` +
        `  subject: ${email.subject}\n` +
        `  ${email.text.replace(/\n/g, "\n  ")}\n`
    );
    return { delivered: false };
  }

  try {
    await t.sendMail({
      from: `"${env.SOFTWARE_NAME}" <${env.SMTP_USER}>`,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { delivered: true };
  } catch (err) {
    // A mail failure must never break the surrounding action (e.g. approval).
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] failed to send to ${email.to}:`, message);
    return { delivered: false, error: message };
  }
}
