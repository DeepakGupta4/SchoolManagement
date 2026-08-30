import { env } from "../../config/env.js";
import type { OutgoingEmail } from "../../utils/email.js";

/**
 * Professional, self-contained HTML email templates. Inline styles only — email
 * clients strip <style> and external CSS — and every template ships a plain-text
 * version alongside so it renders in text-only clients and reads cleanly in the
 * console fallback.
 */

const BRAND = "#2563eb";

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <tr><td style="background:${BRAND};padding:22px 28px">
      <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px">${env.SOFTWARE_NAME}</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700">${title}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
      ${env.SOFTWARE_NAME} · School Management SaaS<br/>
      This is an automated message. Need help? Reply to this email.
    </td></tr>
  </table></body></html>`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** Sent to the school the moment their demo request is received. */
export function requestReceivedEmail(input: { to: string; schoolName: string }): OutgoingEmail {
  const text = `Hi,

Thanks for requesting a demo of ${env.SOFTWARE_NAME} for ${input.schoolName}.

Your request has been received and is now under review by our team. Once approved, we'll email your login credentials and your 7-day free trial will begin.

— ${env.SOFTWARE_NAME}`;

  return {
    to: input.to,
    subject: `We received your ${env.SOFTWARE_NAME} demo request`,
    text,
    html: shell(
      "Your demo request has been received",
      `<p style="margin:0 0 12px;line-height:1.6">Thanks for requesting a demo of <b>${env.SOFTWARE_NAME}</b> for <b>${input.schoolName}</b>.</p>
       <p style="margin:0 0 12px;line-height:1.6">Your request is now under review by our team. Once approved, we'll email your login credentials and your <b>7-day free trial</b> will begin.</p>`
    ),
  };
}

/** The approval email carrying the temporary credentials and trial window. */
export function approvalEmail(input: {
  to: string;
  schoolName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  trialStartDate: Date;
  trialEndDate: Date;
}): OutgoingEmail {
  const start = fmtDate(input.trialStartDate);
  const end = fmtDate(input.trialEndDate);

  const text = `Welcome to ${env.SOFTWARE_NAME}!

Your school account has been approved.

Login details
  School:   ${input.schoolName}
  Email:    ${input.email}
  Password: ${input.temporaryPassword}
  Login:    ${input.loginUrl}

Your 7-day free trial started on ${start} and expires on ${end}.

After the trial expires, the software will be locked until you activate a subscription. Your data is always kept safe.

Please change your password after your first login.

— ${env.SOFTWARE_NAME}`;

  return {
    to: input.to,
    subject: `Your ${env.SOFTWARE_NAME} account has been approved`,
    text,
    html: shell(
      `Welcome to ${env.SOFTWARE_NAME}`,
      `<p style="margin:0 0 16px;line-height:1.6">Your school account has been approved. Here are your login details:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 0 18px">
         ${row("School", input.schoolName)}
         ${row("Email", input.email)}
         ${row("Temporary password", `<code style="background:#eef2ff;color:${BRAND};padding:2px 8px;border-radius:6px;font-size:14px">${input.temporaryPassword}</code>`)}
         ${row("Login URL", `<a href="${input.loginUrl}" style="color:${BRAND}">${input.loginUrl}</a>`)}
       </table>
       <p style="margin:0 0 8px;line-height:1.6">Your <b>7-day free trial</b> started on <b>${start}</b> and expires on <b>${end}</b>.</p>
       <p style="margin:0 0 16px;line-height:1.6;color:#475569">After the trial expires the software is locked until you activate a subscription — but your data is always kept safe.</p>
       <a href="${input.loginUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Log in now</a>
       <p style="margin:18px 0 0;line-height:1.6;color:#64748b;font-size:13px">For your security, please change your password after your first login.</p>`
    ),
  };
}

/** Sent when a Super Admin rejects a request. */
export function rejectionEmail(input: {
  to: string;
  schoolName: string;
  reason?: string;
}): OutgoingEmail {
  const reasonLine = input.reason ? `\n\nReason: ${input.reason}` : "";
  const text = `Hi,

Thank you for your interest in ${env.SOFTWARE_NAME} for ${input.schoolName}.

After reviewing your request, we're unable to approve it at this time.${reasonLine}

If you believe this is a mistake, just reply to this email and we'll take another look.

— ${env.SOFTWARE_NAME}`;

  return {
    to: input.to,
    subject: `Update on your ${env.SOFTWARE_NAME} demo request`,
    text,
    html: shell(
      "About your demo request",
      `<p style="margin:0 0 12px;line-height:1.6">Thank you for your interest in <b>${env.SOFTWARE_NAME}</b> for <b>${input.schoolName}</b>.</p>
       <p style="margin:0 0 12px;line-height:1.6">After reviewing your request, we're unable to approve it at this time.</p>
       ${input.reason ? `<p style="margin:0 0 12px;line-height:1.6;color:#475569"><b>Reason:</b> ${input.reason}</p>` : ""}
       <p style="margin:0;line-height:1.6">If you believe this is a mistake, just reply to this email and we'll take another look.</p>`
    ),
  };
}

/** Trial is ending in a couple of days. */
export function trialEndingSoonEmail(input: {
  to: string;
  schoolName: string;
  daysRemaining: number;
  trialEndDate: Date;
  loginUrl: string;
}): OutgoingEmail {
  const end = fmtDate(input.trialEndDate);
  const days = `${input.daysRemaining} ${input.daysRemaining === 1 ? "day" : "days"}`;
  const text = `Hi,

Your ${env.SOFTWARE_NAME} free trial for ${input.schoolName} ends in ${days}, on ${end}.

Activate your subscription now to keep access — your data stays exactly as it is.
Sign in: ${input.loginUrl}

— ${env.SOFTWARE_NAME}`;
  return {
    to: input.to,
    subject: `Your ${env.SOFTWARE_NAME} trial ends in ${days}`,
    text,
    html: shell(
      "Your free trial is ending soon",
      `<p style="margin:0 0 12px;line-height:1.6">Your free trial for <b>${input.schoolName}</b> ends in <b>${days}</b>, on <b>${end}</b>.</p>
       <p style="margin:0 0 16px;line-height:1.6">Activate your subscription now to keep access — your data stays exactly as it is.</p>
       <a href="${input.loginUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Activate subscription</a>`
    ),
  };
}

/** Trial has just expired. */
export function trialExpiredEmail(input: { to: string; schoolName: string; loginUrl: string }): OutgoingEmail {
  const text = `Hi,

Your ${env.SOFTWARE_NAME} free trial for ${input.schoolName} has expired.

Your school data is safe and has not been deleted. Activate a subscription to continue.
Sign in: ${input.loginUrl}

— ${env.SOFTWARE_NAME}`;
  return {
    to: input.to,
    subject: `Your ${env.SOFTWARE_NAME} trial has expired`,
    text,
    html: shell(
      "Your free trial has expired",
      `<p style="margin:0 0 12px;line-height:1.6">Your free trial for <b>${input.schoolName}</b> has expired.</p>
       <p style="margin:0 0 16px;line-height:1.6">Your school data is safe and has not been deleted. Activate a subscription to continue.</p>
       <a href="${input.loginUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Activate now</a>`
    ),
  };
}

/** Payment received and subscription activated. */
export function paymentSuccessEmail(input: {
  to: string;
  schoolName: string;
  plan: string;
  amountInr: number;
  paidUntil: Date;
}): OutgoingEmail {
  const until = fmtDate(input.paidUntil);
  const amount = `₹${input.amountInr.toLocaleString("en-IN")}`;
  const text = `Hi,

Thank you! Your ${input.plan} subscription for ${input.schoolName} is now active.

Amount paid: ${amount}
Active until: ${until}

— ${env.SOFTWARE_NAME}`;
  return {
    to: input.to,
    subject: `Payment received — your ${env.SOFTWARE_NAME} subscription is active`,
    text,
    html: shell(
      "Your subscription is active 🎉",
      `<p style="margin:0 0 16px;line-height:1.6">Thank you! Your <b>${input.plan}</b> subscription for <b>${input.schoolName}</b> is now active.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 0 8px">
         ${row("Amount paid", amount)}
         ${row("Active until", until)}
       </table>`
    ),
  };
}

/** Paid subscription is ending in a few days. */
export function subscriptionExpiringSoonEmail(input: {
  to: string;
  schoolName: string;
  daysRemaining: number;
  paidEndDate: Date;
  loginUrl: string;
}): OutgoingEmail {
  const end = fmtDate(input.paidEndDate);
  const days = `${input.daysRemaining} ${input.daysRemaining === 1 ? "day" : "days"}`;
  const text = `Hi,

Your ${env.SOFTWARE_NAME} subscription for ${input.schoolName} expires in ${days}, on ${end}.

Renew now to avoid any interruption.
Sign in: ${input.loginUrl}

— ${env.SOFTWARE_NAME}`;
  return {
    to: input.to,
    subject: `Your ${env.SOFTWARE_NAME} subscription expires in ${days}`,
    text,
    html: shell(
      "Your subscription is expiring soon",
      `<p style="margin:0 0 12px;line-height:1.6">Your subscription for <b>${input.schoolName}</b> expires in <b>${days}</b>, on <b>${end}</b>.</p>
       <p style="margin:0 0 16px;line-height:1.6">Renew now to avoid any interruption.</p>
       <a href="${input.loginUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Renew subscription</a>`
    ),
  };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:11px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:150px">${label}</td>
    <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600">${value}</td>
  </tr>`;
}
