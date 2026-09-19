import type { HydratedDocument } from "mongoose";
import { Workflow, type WorkflowAttrs } from "./workflow.model.js";
import { Student } from "../students/student.model.js";
import { Application } from "../admissions/admission.model.js";
import { School } from "../schools/school.model.js";
import { notifySchool } from "../notifications/notification.model.js";

/** Outcome of evaluating one rule. `message` explains what happened either way. */
export interface RuleResult {
  name: string;
  message: string;
  /** Whether a notification was actually posted. */
  notified?: boolean;
}

type WorkflowDoc = HydratedDocument<WorkflowAttrs>;

/** Auto sweep dedupe window — a rule that ran within this many ms is skipped. */
const AUTO_SKIP_MS = 20 * 60 * 60 * 1000;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Evaluates one rule against live data and, when its condition matches, posts a
 * school notification. Returns a human-readable summary of what happened. Does
 * NOT touch runCount/lastRunAt — callers own that bookkeeping.
 */
async function evaluateRule(schoolId: string, rule: WorkflowDoc): Promise<RuleResult> {
  const name = rule.name;

  switch (rule.trigger) {
    case "attendance_low": {
      const threshold = rule.threshold || 75;
      const count = await Student.countDocuments({
        schoolId,
        status: "active",
        attendancePercent: { $lt: threshold },
      });
      if (count > 0) {
        const title = `${count} students below ${threshold}% attendance`;
        await notifySchool(schoolId, {
          type: "workflow",
          title,
          body: `Automation "${name}" flagged ${count} student(s) with attendance under ${threshold}%.`,
          link: "/students",
        });
        return { name, message: title, notified: true };
      }
      return { name, message: `No students below ${threshold}% attendance.` };
    }

    case "fee_overdue": {
      const students = await Student.find({ schoolId, feeDue: { $gt: 0 } }).select("feeDue");
      const count = students.length;
      if (count > 0) {
        const total = students.reduce((sum, s) => sum + (s.feeDue || 0), 0);
        const title = `${count} students with fees overdue`;
        await notifySchool(schoolId, {
          type: "workflow",
          title,
          body: `${count} student(s) owe a total of ${inr(total)} in pending fees.`,
          link: "/fees/collect",
        });
        return { name, message: `${title} · ${inr(total)}`, notified: true };
      }
      return { name, message: "No overdue fees." };
    }

    case "birthday_today": {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      // dateOfBirth is stored as "yyyy-mm-dd"; match on the mm-dd tail.
      const students = await Student.find({
        schoolId,
        status: "active",
        dateOfBirth: { $regex: `-${mm}-${dd}$` },
      }).select("firstName lastName");
      const count = students.length;
      if (count > 0) {
        const names = students.slice(0, 5).map((s) => `${s.firstName} ${s.lastName}`);
        const more = count > 5 ? ` +${count - 5} more` : "";
        const title = count === 1 ? "1 student has a birthday today" : `${count} students have birthdays today`;
        await notifySchool(schoolId, {
          type: "workflow",
          title,
          body: `${names.join(", ")}${more}. Send them a wish!`,
          link: "/students",
        });
        return { name, message: `${title}: ${names.join(", ")}${more}`, notified: true };
      }
      return { name, message: "No birthdays today." };
    }

    case "admission_pending": {
      const count = await Application.countDocuments({
        schoolId,
        stage: { $in: ["enquiry", "applied", "interview"] },
      });
      if (count > 0) {
        const title = `${count} admission applications pending`;
        await notifySchool(schoolId, {
          type: "workflow",
          title,
          body: `${count} application(s) are awaiting review (enquiry / applied / interview).`,
          link: "/students/admissions",
        });
        return { name, message: title, notified: true };
      }
      return { name, message: "No pending admissions." };
    }

    default:
      return { name, message: `Unknown trigger "${rule.trigger}".` };
  }
}

/**
 * Runs one rule end-to-end: evaluate, notify, and stamp runCount/lastRunAt.
 * Used by the single-rule "Run" endpoint.
 */
export async function runSingleWorkflow(rule: WorkflowDoc): Promise<RuleResult> {
  const result = await evaluateRule(rule.schoolId, rule);
  rule.runCount = (rule.runCount || 0) + 1;
  rule.lastRunAt = new Date().toISOString();
  await rule.save();
  return result;
}

/**
 * Evaluates every enabled rule for a school. In `auto` mode a rule that ran
 * within the last ~20h is skipped so periodic sweeps don't re-alert. Each rule
 * is isolated in try/catch — one failure never blocks the others.
 */
export async function runWorkflowsForSchool(
  schoolId: string,
  opts: { auto?: boolean } = {}
): Promise<{ ran: number; notified: number; results: RuleResult[] }> {
  const rules = (await Workflow.find({ schoolId, enabled: true })) as WorkflowDoc[];

  let ran = 0;
  let notified = 0;
  const results: RuleResult[] = [];

  for (const rule of rules) {
    try {
      if (opts.auto && rule.lastRunAt) {
        const last = new Date(rule.lastRunAt).getTime();
        if (!Number.isNaN(last) && Date.now() - last < AUTO_SKIP_MS) {
          continue; // recently run — dedupe
        }
      }

      const result = await runSingleWorkflow(rule);
      ran += 1;
      if (result.notified) notified += 1;
      results.push(result);
    } catch (err) {
      console.error(`[workflow] rule "${rule.name}" failed:`, err);
      results.push({ name: rule.name, message: "Rule failed to run." });
    }
  }

  return { ran, notified, results };
}

/**
 * Best-effort sweep across every school. Called from the server's periodic
 * sweep; failures for one school never stop the rest.
 */
export async function runAllSchools(): Promise<void> {
  let schoolIds: string[] = [];
  try {
    const schools = await School.find().select("schoolId");
    schoolIds = [...new Set(schools.map((s) => s.schoolId).filter(Boolean))];
  } catch (err) {
    console.error("[workflow] could not list schools:", err);
    return;
  }

  for (const schoolId of schoolIds) {
    try {
      await runWorkflowsForSchool(schoolId, { auto: true });
    } catch (err) {
      console.error(`[workflow] sweep for ${schoolId} failed:`, err);
    }
  }
}
