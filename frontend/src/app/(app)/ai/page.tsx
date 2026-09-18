"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  FileText,
  Info,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Skeleton,
  StatCard,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  askAi,
  getAiInsights,
  getAiStatus,
  type AiInsight,
  type AiInsightsResult,
} from "@/lib/api/ai";

type Tone = "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";

const GRADIENTS: Record<Tone, string> = {
  indigo: "gradient-indigo",
  emerald: "gradient-emerald",
  amber: "gradient-amber",
  rose: "gradient-rose",
  violet: "gradient-violet",
  cyan: "gradient-cyan",
};

const toneBadge: Record<AiInsight["tone"], "info" | "success" | "warning" | "danger"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

// What the AI suite can actually do today, and where each capability lives.
const CAPABILITIES = [
  {
    icon: AlertTriangle,
    tone: "rose" as Tone,
    name: "Student Risk Detection",
    description: "Analyses each student's attendance, marks and fee status to flag dropout/academic risk with a reason and recommendation. Open any student profile.",
  },
  {
    icon: Lightbulb,
    tone: "amber" as Tone,
    name: "School Insights",
    description: "Summarises your live data into actionable insights — shown in the feed below and refreshed on demand.",
  },
  {
    icon: FileText,
    tone: "indigo" as Tone,
    name: "Report-Card Remarks",
    description: "Drafts a personalised remark from a student's marks and attendance. Available on the student profile.",
  },
  {
    icon: MessageSquare,
    tone: "violet" as Tone,
    name: "Ask AI",
    description: "Ask questions about your school data and get grounded answers. Use the assistant on this page.",
  },
];

export default function AiPage() {
  const { toast } = useToast();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [data, setData] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Ask-AI state
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const loadInsights = () => {
    setLoading(true);
    getAiInsights()
      .then(setData)
      .catch(() => toast({ title: "Could not load insights", variant: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      getAiStatus()
        .then((s) => !cancelled && setConfigured(s.configured))
        .catch(() => !cancelled && setConfigured(false));
      getAiInsights()
        .then((d) => !cancelled && setData(d))
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await askAi(q);
      setAnswer(res.answer);
      // Bring the answer into view once it renders.
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    } catch {
      toast({ title: "Could not get an answer", description: "Please try again.", variant: "error" });
    } finally {
      setAsking(false);
    }
  };

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="AI Suite"
        description="Gemini-powered risk detection, insights, remarks and a data assistant."
        actions={
          <Button variant="outline" onClick={loadInsights} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh insights
          </Button>
        }
      />

      {/* Configuration banner */}
      {configured === false && (
        <Card className="border-warning/40 bg-warning-soft/40">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="mt-0.5 size-5 shrink-0 text-warning-text" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-text">Gemini isn&apos;t connected yet</p>
              <p className="mt-0.5 text-muted">
                Everything below still works using the built-in rule engine. To enable full AI, create a free key
                at <span className="font-medium text-text">aistudio.google.com</span> and add it on the server as{" "}
                <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">GEMINI_API_KEY</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {configured && (
        <div className="flex items-center gap-2 text-xs text-success-text">
          <Sparkles className="size-3.5" />
          <span className="font-medium">Gemini connected — insights and answers are AI-generated.</span>
        </div>
      )}

      {/* Live stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={stats?.totalActive ?? 0} icon={Users} tone="indigo" />
        <StatCard label="High risk" value={stats?.highRisk ?? 0} icon={AlertTriangle} tone="rose" />
        <StatCard label="Avg attendance" value={stats?.avgAttendance ?? 0} suffix="%" icon={TrendingUp} tone="emerald" />
        <StatCard label="Avg performance" value={stats?.avgPerformance ?? 0} suffix="%" icon={BookOpenCheck} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Insights feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text">AI Insights</h2>
              <p className="mt-0.5 text-xs text-muted">Generated from your live attendance, marks and fee data.</p>
            </div>
            {data && <Badge variant={data.source === "gemini" ? "success" : "default"}>{data.source === "gemini" ? "Gemini" : "Rule engine"}</Badge>}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : !data || data.insights.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No insights yet. Add students to get started.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.insights.map((insight, i) => (
                  <li key={i} className="rounded-md border border-border bg-surface-sunken p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text">{insight.title}</p>
                      <Badge variant={toneBadge[insight.tone] ?? "info"}>{insight.tone}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{insight.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Ask AI */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-text">Ask AI</h2>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <p className="text-xs text-muted">
              Ask about your school — e.g. &ldquo;Which class has the lowest attendance?&rdquo;
            </p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk();
              }}
              rows={3}
              placeholder="Type your question…"
              className="focus-ring w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle"
            />
            <Button onClick={handleAsk} disabled={asking || !question.trim()}>
              <Send className={cn("size-4", asking && "animate-pulse")} />
              {asking ? "Thinking…" : "Ask"}
            </Button>
            {answer && (
              <div ref={answerRef} className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text">
                {answer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">What the AI Suite can do</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.name}>
                <CardContent className="flex h-full flex-col gap-3">
                  <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md text-white shadow-sm", GRADIENTS[c.tone])}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text">{c.name}</h3>
                    <p className="mt-1.5 text-xs text-muted">{c.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
