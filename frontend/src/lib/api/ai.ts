import { apiRequest } from "./client";

export type RiskLevel = "low" | "medium" | "high";
export type InsightTone = "info" | "success" | "warning" | "danger";
export type AiSource = "openai" | "gemini" | "rule";

export interface AiRisk {
  score: number;
  level: RiskLevel;
  reason: string;
  recommendation: string;
  source: AiSource;
}

export interface AiInsight {
  title: string;
  detail: string;
  tone: InsightTone;
}

export interface AiInsightsResult {
  insights: AiInsight[];
  stats: {
    totalActive: number;
    highRisk: number;
    mediumRisk: number;
    avgAttendance: number;
    avgPerformance: number;
    totalDues: number;
  };
  source: AiSource;
}

export function getAiStatus() {
  return apiRequest<{ configured: boolean; provider?: "openai" | "gemini" | "none" }>("/api/ai/status");
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Sends a message (with recent history) to the SchoolDeck assistant. */
export function chatWithAssistant(message: string, history: ChatTurn[]) {
  return apiRequest<{ reply: string; source: AiSource }>("/api/ai/chat", {
    method: "POST",
    body: { message, history },
  });
}

export function getStudentRisk(studentId: string) {
  return apiRequest<AiRisk>("/api/ai/risk", { method: "POST", body: { studentId } });
}

export function getAiInsights() {
  return apiRequest<AiInsightsResult>("/api/ai/insights");
}

export function generateRemark(studentId: string) {
  return apiRequest<{ remark: string; source: AiSource }>("/api/ai/remarks", {
    method: "POST",
    body: { studentId },
  });
}

export function askAi(question: string) {
  return apiRequest<{ answer: string; source: AiSource }>("/api/ai/ask", {
    method: "POST",
    body: { question },
  });
}

export interface QuestionPaperInput {
  className: string;
  subject: string;
  topics?: string;
  totalMarks?: number;
  /** Free-text paper pattern from the teacher (question types, counts, marks). */
  instructions?: string;
  /** Text extracted from an uploaded book/chapter PDF, to ground the paper. */
  bookContext?: string;
}

export interface QuestionPaperResult {
  paper: string;
  source: AiSource;
}

export function generateQuestionPaper(input: QuestionPaperInput) {
  return apiRequest<QuestionPaperResult>("/api/ai/question-paper", {
    method: "POST",
    body: input,
  });
}

export interface BulkRemarksInput {
  className: string;
  section?: string;
}

export interface StudentRemark {
  id: string;
  name: string;
  remark: string;
}

export interface BulkRemarksResult {
  remarks: StudentRemark[];
  source: AiSource;
}

export function generateBulkRemarks(input: BulkRemarksInput) {
  return apiRequest<BulkRemarksResult>("/api/ai/remarks-bulk", {
    method: "POST",
    body: input,
  });
}

export interface LessonPlanInput {
  className: string;
  subject: string;
  topic: string;
  duration?: string;
}

export interface LessonPlanResult {
  plan: string;
  source: AiSource;
}

export function generateLessonPlan(input: LessonPlanInput) {
  return apiRequest<LessonPlanResult>("/api/ai/lesson-plan", {
    method: "POST",
    body: input,
  });
}
