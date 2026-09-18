import { apiRequest } from "./client";

export type RiskLevel = "low" | "medium" | "high";
export type InsightTone = "info" | "success" | "warning" | "danger";
export type AiSource = "gemini" | "rule";

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
  return apiRequest<{ configured: boolean }>("/api/ai/status");
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
