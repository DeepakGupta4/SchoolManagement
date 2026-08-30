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

/** Whether real email delivery is configured (SMTP credentials present). */
export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      // Gmail app passwords are shown with spaces ("abcd efgh …") but must be
      // sent without them — strip whitespace so either form works.
      auth: { user: env.SMTP_USER, pass: (env.SMTP_PASS ?? "").replace(/\s+/g, "") },
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
