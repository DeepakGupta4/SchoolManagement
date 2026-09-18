import { Router } from "express";
import { Student } from "../students/student.model.js";
import { isGeminiConfigured, geminiGenerate, geminiJson } from "../../utils/gemini.js";

/**
 * AI endpoints, powered by Google Gemini when GEMINI_API_KEY is set and
 * gracefully degrading to a deterministic rule-based engine otherwise. Mounted
 * behind the tenant guard, so every handler is scoped to req.user.schoolId.
 */
const router = Router();

type RiskLevel = "low" | "medium" | "high";

interface RiskResult {
  score: number;
  level: RiskLevel;
  reason: string;
  recommendation: string;
  source: "gemini" | "rule";
}

/** Deterministic baseline — always available, and the fallback for Gemini. */
function ruleRisk(s: {
  firstName: string;
  attendancePercent: number;
  performancePercent: number;
  feeDue: number;
}): RiskResult {
  const factors: string[] = [];
  let score = 0;

  if (s.attendancePercent < 60) {
    score += 45;
    factors.push(`attendance critically low (${s.attendancePercent}%)`);
  } else if (s.attendancePercent < 75) {
    score += 28;
    factors.push(`attendance below 75% (${s.attendancePercent}%)`);
  } else if (s.attendancePercent < 85) {
    score += 12;
    factors.push(`attendance slipping (${s.attendancePercent}%)`);
  }

  if (s.performancePercent < 40) {
    score += 35;
    factors.push(`failing average (${s.performancePercent}%)`);
  } else if (s.performancePercent < 55) {
    score += 20;
    factors.push(`weak performance (${s.performancePercent}%)`);
  } else if (s.performancePercent < 65) {
    score += 8;
    factors.push(`performance below expectation (${s.performancePercent}%)`);
  }

  if (s.feeDue > 8000) {
    score += 20;
    factors.push(`significant fee dues (₹${s.feeDue.toLocaleString("en-IN")})`);
  } else if (s.feeDue > 0) {
    score += 8;
    factors.push(`outstanding fees (₹${s.feeDue.toLocaleString("en-IN")})`);
  }

  score = Math.min(100, score);
  const level: RiskLevel = score >= 55 ? "high" : score >= 30 ? "medium" : "low";
  const reason = factors.length ? factors.join("; ") : "All key indicators are healthy.";
  const recommendation =
    level === "high"
      ? "Arrange a parent meeting and loop in the class teacher and counsellor."
      : level === "medium"
        ? "Monitor closely and schedule a guardian check-in."
        : "No action needed — keep encouraging.";

  return { score, level, reason, recommendation, source: "rule" };
}

/** GET /api/ai/status — whether Gemini is wired up. */
router.get("/status", (_req, res) => {
  res.json({ data: { configured: isGeminiConfigured() } });
});

/** POST /api/ai/risk { studentId } — per-student risk assessment. */
router.post("/risk", async (req, res, next) => {
  try {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) return res.status(400).json({ error: "studentId is required" });

    const schoolId = req.user!.schoolId;
    const doc = await Student.findOne({ _id: studentId, schoolId }).catch(() => null);
    if (!doc) return res.status(404).json({ error: "Student not found" });

    const s = {
      firstName: doc.firstName,
      attendancePercent: doc.attendancePercent ?? 0,
      performancePercent: doc.performancePercent ?? 0,
      feeDue: doc.feeDue ?? 0,
    };
    const base = ruleRisk(s);

    if (!isGeminiConfigured()) return res.json({ data: base });

    try {
      const prompt = `You are a school counsellor's assistant. Assess dropout/academic risk for a student and respond ONLY as JSON: {"score": number 0-100, "level": "low"|"medium"|"high", "reason": string, "recommendation": string}.
Student: ${doc.firstName} ${doc.lastName}, Class ${doc.className}-${doc.section}.
Attendance: ${s.attendancePercent}%. Average marks: ${s.performancePercent}%. Fee dues: ₹${s.feeDue}.
Keep reason and recommendation concise (max 2 sentences each), practical and specific to these numbers.`;
      const ai = await geminiJson<Omit<RiskResult, "source">>(prompt);
      res.json({
        data: {
          score: Math.max(0, Math.min(100, Math.round(Number(ai.score) || base.score))),
          level: (["low", "medium", "high"].includes(ai.level) ? ai.level : base.level) as RiskLevel,
          reason: String(ai.reason || base.reason),
          recommendation: String(ai.recommendation || base.recommendation),
          source: "gemini" as const,
        },
      });
    } catch {
      res.json({ data: base });
    }
  } catch (err) {
    next(err);
  }
});

/** GET /api/ai/insights — school-wide insights over live data. */
router.get("/insights", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const students = await Student.find({ schoolId, status: "active" });

    const total = students.length;
    const agg = students.reduce(
      (a, s) => {
        const r = ruleRisk({
          firstName: s.firstName,
          attendancePercent: s.attendancePercent ?? 0,
          performancePercent: s.performancePercent ?? 0,
          feeDue: s.feeDue ?? 0,
        });
        if (r.level === "high") a.high += 1;
        else if (r.level === "medium") a.medium += 1;
        a.attendance += s.attendancePercent ?? 0;
        a.performance += s.performancePercent ?? 0;
        a.dues += s.feeDue ?? 0;
        return a;
      },
      { high: 0, medium: 0, attendance: 0, performance: 0, dues: 0 }
    );

    const stats = {
      totalActive: total,
      highRisk: agg.high,
      mediumRisk: agg.medium,
      avgAttendance: total ? Math.round(agg.attendance / total) : 0,
      avgPerformance: total ? Math.round(agg.performance / total) : 0,
      totalDues: agg.dues,
    };

    // Deterministic fallback insights.
    const fallback = [
      total === 0
        ? { title: "No students yet", detail: "Add students to start seeing AI insights.", tone: "info" }
        : { title: `${stats.highRisk} student(s) at high risk`, detail: `${stats.mediumRisk} more need attention. Average attendance is ${stats.avgAttendance}%.`, tone: stats.highRisk > 0 ? "danger" : "success" },
      { title: `Average performance ${stats.avgPerformance}%`, detail: stats.avgPerformance < 55 ? "Below target — consider remedial sessions." : "On track across active students.", tone: stats.avgPerformance < 55 ? "warning" : "success" },
      { title: `₹${stats.totalDues.toLocaleString("en-IN")} in outstanding fees`, detail: stats.totalDues > 0 ? "Send reminders to guardians with pending dues." : "All fees are cleared.", tone: stats.totalDues > 0 ? "warning" : "success" },
    ];

    if (!isGeminiConfigured() || total === 0) {
      return res.json({ data: { insights: fallback, stats, source: isGeminiConfigured() ? "gemini" : "rule" } });
    }

    try {
      const prompt = `You are a school analytics assistant. Given these live stats, produce 3-5 short, actionable insights as JSON: {"insights":[{"title": string, "detail": string, "tone": "info"|"success"|"warning"|"danger"}]}.
Stats: ${JSON.stringify(stats)}.
Each title max 8 words; each detail max 20 words, specific and practical.`;
      const ai = await geminiJson<{ insights: { title: string; detail: string; tone: string }[] }>(prompt);
      const insights = Array.isArray(ai.insights) && ai.insights.length ? ai.insights : fallback;
      res.json({ data: { insights, stats, source: "gemini" } });
    } catch {
      res.json({ data: { insights: fallback, stats, source: "rule" } });
    }
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/remarks { studentId } — report-card remark. */
router.post("/remarks", async (req, res, next) => {
  try {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) return res.status(400).json({ error: "studentId is required" });

    const schoolId = req.user!.schoolId;
    const doc = await Student.findOne({ _id: studentId, schoolId }).catch(() => null);
    if (!doc) return res.status(404).json({ error: "Student not found" });

    const attendance = doc.attendancePercent ?? 0;
    const performance = doc.performancePercent ?? 0;

    const fallback = `${doc.firstName} has maintained ${attendance}% attendance with an average of ${performance}%. ${
      performance >= 65
        ? "A consistent and sincere student; keep up the good work."
        : performance >= 45
          ? "Shows potential; more regular practice will lift results."
          : "Needs focused support and regular revision to improve outcomes."
    }`;

    if (!isGeminiConfigured()) return res.json({ data: { remark: fallback, source: "rule" } });

    try {
      const prompt = `Write a warm, professional report-card remark (2-3 sentences, teacher's voice) for ${doc.firstName} ${doc.lastName}, Class ${doc.className}. Attendance ${attendance}%, average marks ${performance}%. Be encouraging but honest; no bullet points, plain text only.`;
      const remark = (await geminiGenerate(prompt, { temperature: 0.6 })).trim();
      res.json({ data: { remark: remark || fallback, source: "gemini" } });
    } catch {
      res.json({ data: { remark: fallback, source: "rule" } });
    }
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/ask { question } — grounded Q&A over school stats. */
router.post("/ask", async (req, res, next) => {
  try {
    const { question } = req.body as { question?: string };
    if (!question || !question.trim()) return res.status(400).json({ error: "question is required" });

    if (!isGeminiConfigured()) {
      return res.json({
        data: {
          answer: "AI assistant is not configured yet. Add a GEMINI_API_KEY on the server to enable it.",
          source: "rule",
        },
      });
    }

    const schoolId = req.user!.schoolId;
    const students = await Student.find({ schoolId, status: "active" });
    const total = students.length;
    const byClass: Record<string, number> = {};
    let attendance = 0;
    let dues = 0;
    for (const s of students) {
      byClass[s.className] = (byClass[s.className] ?? 0) + 1;
      attendance += s.attendancePercent ?? 0;
      dues += s.feeDue ?? 0;
    }
    const context = {
      activeStudents: total,
      classDistribution: byClass,
      avgAttendance: total ? Math.round(attendance / total) : 0,
      totalOutstandingDues: dues,
    };

    try {
      const prompt = `You are the assistant for a school admin. Answer the question using ONLY this data context; if the data can't answer it, say so briefly. Be concise (max 4 sentences), plain text.
DATA: ${JSON.stringify(context)}
QUESTION: ${question.trim()}`;
      const answer = (await geminiGenerate(prompt, { temperature: 0.3 })).trim();
      res.json({ data: { answer, source: "gemini" } });
    } catch {
      res.json({
        data: { answer: "Sorry, the AI service is temporarily unavailable. Please try again.", source: "rule" },
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
