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

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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

export async function sendEmail(email: OutgoingEmail): Promise<{ delivered: boolean }> {
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
    console.error(`[email] failed to send to ${email.to}:`, err);
    return { delivered: false };
  }
}
