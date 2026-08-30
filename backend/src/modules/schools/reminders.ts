import { env } from "../../config/env.js";
import { sendEmail } from "../../utils/email.js";
import { School } from "./school.model.js";
import {
  trialEndingSoonEmail,
  trialExpiredEmail,
  subscriptionExpiringSoonEmail,
} from "./emails.js";

/**
 * Sweeps every school and sends any subscription email that has come due —
 * trial ending, trial expired, paid plan expiring — using the SERVER clock.
 * Each email fires at most once per window (guarded by `notified*` flags that
 * reset when the window changes), so running this repeatedly is safe and
 * idempotent. Driven by a boot interval and an on-demand cron endpoint.
 */

const DAY = 86_400_000;
const TRIAL_ENDING_WITHIN_DAYS = 2;
const PAID_ENDING_WITHIN_DAYS = 3;

export async function runSubscriptionReminders(now: Date = new Date()): Promise<{
  trialEnding: number;
  trialExpired: number;
  paidEnding: number;
}> {
  const counts = { trialEnding: 0, trialExpired: 0, paidEnding: 0 };

  // Only schools that could plausibly need a reminder.
  const schools = await School.find({ status: { $ne: "suspended" }, "subscription.freeAccess": { $ne: true } });

  for (const school of schools) {
    const sub = school.subscription;
    let changed = false;
    const days = (end: Date) => Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));

    const onPaidPlan = sub.plan !== "trial" && !!sub.paidEndDate;

    if (onPaidPlan && sub.paidEndDate) {
      if (now < sub.paidEndDate && days(sub.paidEndDate) <= PAID_ENDING_WITHIN_DAYS && !sub.notifiedPaidEnding) {
        await sendEmail(
          subscriptionExpiringSoonEmail({
            to: school.email,
            schoolName: school.name,
            daysRemaining: days(sub.paidEndDate),
            paidEndDate: sub.paidEndDate,
            loginUrl: env.APP_LOGIN_URL,
          })
        );
        sub.notifiedPaidEnding = true;
        counts.paidEnding++;
        changed = true;
      }
    } else if (sub.trialEndDate) {
      if (now < sub.trialEndDate && days(sub.trialEndDate) <= TRIAL_ENDING_WITHIN_DAYS && !sub.notifiedTrialEnding) {
        await sendEmail(
          trialEndingSoonEmail({
            to: school.email,
            schoolName: school.name,
            daysRemaining: days(sub.trialEndDate),
            trialEndDate: sub.trialEndDate,
            loginUrl: env.APP_LOGIN_URL,
          })
        );
        sub.notifiedTrialEnding = true;
        counts.trialEnding++;
        changed = true;
      }
      if (now >= sub.trialEndDate && !sub.notifiedTrialExpired) {
        await sendEmail(
          trialExpiredEmail({ to: school.email, schoolName: school.name, loginUrl: env.APP_LOGIN_URL })
        );
        sub.notifiedTrialExpired = true;
        counts.trialExpired++;
        changed = true;
      }
    }

    if (changed) await school.save();
  }

  return counts;
}
