"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  Textarea,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { useSubscription } from "@/hooks/useSubscription";
import { extractPdfText } from "@/lib/pdfText";
import { printQuestionPaper } from "@/lib/printPaper";
import {
  askAi,
  generateBulkRemarks,
  generateLessonPlan,
  generateQuestionPaper,
  getAiInsights,
  getAiStatus,
  type AiInsight,
  type AiInsightsResult,
  type StudentRemark,
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
  const { classOptions, sectionOptions } = useClassOptions();
  const { subjectNames } = useSubjectOptions();
  const { sub } = useSubscription();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [data, setData] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Ask-AI state
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  // Question Paper Generator state
  const [qpOpen, setQpOpen] = useState(false);
  const [qpForm, setQpForm] = useState({ className: "", subject: "", topics: "", totalMarks: "100", instructions: "" });
  const [qpLoading, setQpLoading] = useState(false);
  const [qpResult, setQpResult] = useState<string | null>(null);
  // Uploaded book/chapter: extracted text + a short status for the UI.
  const [qpBook, setQpBook] = useState<{ text: string; label: string } | null>(null);
  const [qpBookReading, setQpBookReading] = useState(false);

  // Bulk Report-Card Remarks state
  const [brOpen, setBrOpen] = useState(false);
  const [brForm, setBrForm] = useState({ className: "", section: "" });
  const [brLoading, setBrLoading] = useState(false);
  const [brResult, setBrResult] = useState<StudentRemark[] | null>(null);

  // Lesson-Plan helper state
  const [lpOpen, setLpOpen] = useState(false);
  const [lpForm, setLpForm] = useState({ className: "", subject: "", topic: "", duration: "45 minutes" });
  const [lpLoading, setLpLoading] = useState(false);
  const [lpResult, setLpResult] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Could not copy", variant: "error" });
    }
  };

  const runQuestionPaper = async () => {
    if (!qpForm.className || !qpForm.subject || qpLoading) return;
    setQpLoading(true);
    setQpResult(null);
    try {
      const res = await generateQuestionPaper({
        className: qpForm.className,
        subject: qpForm.subject,
        topics: qpForm.topics || undefined,
        totalMarks: Number(qpForm.totalMarks) || 100,
        instructions: qpForm.instructions || undefined,
        bookContext: qpBook?.text || undefined,
      });
      setQpResult(res.paper);
    } catch {
      toast({ title: "Could not generate the paper", description: "Please try again.", variant: "error" });
    } finally {
      setQpLoading(false);
    }
  };

  const handleBookUpload = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "error" });
      return;
    }
    setQpBookReading(true);
    try {
      const { text, pages, truncated } = await extractPdfText(file);
      if (!text) {
        toast({
          title: "Couldn't read this PDF",
          description: "It may be a scanned image with no selectable text.",
          variant: "error",
        });
        setQpBook(null);
        return;
      }
      const label = `${file.name} · ${pages} page${pages === 1 ? "" : "s"}${truncated ? " (first part used)" : ""}`;
      setQpBook({ text, label });
      toast({ title: "Book added", description: "Questions will be based on this PDF." });
    } catch {
      toast({ title: "Couldn't read this PDF", description: "Try another file.", variant: "error" });
      setQpBook(null);
    } finally {
      setQpBookReading(false);
    }
  };

  const downloadPaper = () => {
    if (!qpResult) return;
    const ok = printQuestionPaper(qpResult, {
      schoolName: sub?.schoolName ?? undefined,
      className: qpForm.className,
      subject: qpForm.subject,
      totalMarks: Number(qpForm.totalMarks) || undefined,
    });
    if (!ok) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site to export the PDF.",
        variant: "error",
      });
    }
  };

  const runBulkRemarks = async () => {
    if (!brForm.className || brLoading) return;
    setBrLoading(true);
    setBrResult(null);
    try {
      const res = await generateBulkRemarks({
        className: brForm.className,
        section: brForm.section || undefined,
      });
      setBrResult(res.remarks);
      if (res.remarks.length === 0) {
        toast({ title: "No active students in that class" });
      }
    } catch {
      toast({ title: "Could not generate remarks", description: "Please try again.", variant: "error" });
    } finally {
      setBrLoading(false);
    }
  };

  const runLessonPlan = async () => {
    if (!lpForm.className || !lpForm.subject || !lpForm.topic || lpLoading) return;
    setLpLoading(true);
    setLpResult(null);
    try {
      const res = await generateLessonPlan({
        className: lpForm.className,
        subject: lpForm.subject,
        topic: lpForm.topic,
        duration: lpForm.duration || undefined,
      });
      setLpResult(res.plan);
    } catch {
      toast({ title: "Could not generate the lesson plan", description: "Please try again.", variant: "error" });
    } finally {
      setLpLoading(false);
    }
  };

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
            {data && <Badge variant={data.source !== "rule" ? "success" : "default"}>{data.source === "openai" ? "OpenAI" : data.source === "gemini" ? "Gemini" : "Rule engine"}</Badge>}
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

      {/* Tools */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text">AI Tools</h2>
          {configured === false && (
            <span className="text-xs text-muted">
              Gemini isn&apos;t connected — tools will show a setup hint instead of AI output.
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ToolCard
            icon={FileText}
            tone="indigo"
            name="Question Paper Generator"
            description="Generate a structured exam paper with sections, marks distribution and mixed question types."
            action="Generate paper"
            onClick={() => {
              setQpResult(null);
              setQpOpen(true);
            }}
          />
          <ToolCard
            icon={ClipboardList}
            tone="emerald"
            name="Bulk Report-Card Remarks"
            description="Draft personalised remarks for a whole class in one go, from live marks and attendance."
            action="Generate remarks"
            onClick={() => {
              setBrResult(null);
              setBrOpen(true);
            }}
          />
          <ToolCard
            icon={NotebookPen}
            tone="violet"
            name="Lesson-Plan Helper"
            description="Build a ready-to-use lesson plan with objectives, activities, assessment and homework."
            action="Generate plan"
            onClick={() => {
              setLpResult(null);
              setLpOpen(true);
            }}
          />
        </div>
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

      {/* Question Paper Generator modal */}
      <Modal
        open={qpOpen}
        onOpenChange={setQpOpen}
        title="Question Paper Generator"
        description="Set the pattern (or upload the book) and generate a ready-to-print paper."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setQpOpen(false)}>
              Close
            </Button>
            {qpResult && (
              <Button variant="outline" onClick={downloadPaper}>
                <Download className="size-4" />
                Export PDF
              </Button>
            )}
            <Button onClick={runQuestionPaper} disabled={qpLoading || !qpForm.className || !qpForm.subject}>
              {qpLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {qpLoading ? "Generating…" : qpResult ? "Regenerate" : "Generate paper"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {configured === false && <ConfigHint />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              value={qpForm.className}
              onChange={(e) => setQpForm((f) => ({ ...f, className: e.target.value }))}
              placeholder="Select class"
              options={classOptions}
            />
            <Input
              label="Subject"
              list="qp-subjects"
              value={qpForm.subject}
              onChange={(e) => setQpForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Pick or type — e.g. Mathematics"
            />
            <datalist id="qp-subjects">
              {subjectNames.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <Input
              label="Total marks"
              type="number"
              value={qpForm.totalMarks}
              onChange={(e) => setQpForm((f) => ({ ...f, totalMarks: e.target.value }))}
              placeholder="100"
            />
          </div>

          <Textarea
            label="Paper pattern / instructions"
            hint="Tell the AI exactly what you want — e.g. 10 MCQs (1 mark each), 5 fill in the blanks, 4 short answers (3 marks), 2 long answers (10 marks). Set difficulty, language, etc."
            value={qpForm.instructions}
            onChange={(e) => setQpForm((f) => ({ ...f, instructions: e.target.value }))}
            placeholder="e.g. 10 MCQ × 1, 5 fill-ups × 1, 5 short × 3, 3 long × 10. Medium difficulty."
            rows={3}
          />

          <Textarea
            label="Topics (optional)"
            value={qpForm.topics}
            onChange={(e) => setQpForm((f) => ({ ...f, topics: e.target.value }))}
            placeholder="e.g. Algebra, Geometry, Trigonometry"
            rows={2}
          />

          {/* Book PDF upload — questions get grounded in this text. */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">Book / chapter PDF (optional)</label>
            {qpBook ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{qpBook.label}</span>
                <button
                  type="button"
                  onClick={() => setQpBook(null)}
                  aria-label="Remove PDF"
                  className="focus-ring rounded-md p-1 text-subtle transition-colors hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="focus-within:outline-none">
                <span className="focus-ring inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-sunken px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-hover">
                  {qpBookReading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {qpBookReading ? "Reading PDF…" : "Upload book/chapter PDF — AI will make questions from it"}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={qpBookReading}
                  onChange={(e) => {
                    handleBookUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <p className="text-xs text-subtle">
              Works with text PDFs (not scanned images). Large books use the first part.
            </p>
          </div>

          {qpResult && <ResultBlock text={qpResult} onCopy={() => copy(qpResult)} />}
        </div>
      </Modal>

      {/* Bulk Report-Card Remarks modal */}
      <Modal
        open={brOpen}
        onOpenChange={setBrOpen}
        title="Bulk Report-Card Remarks"
        description="Pick a class to draft a remark for every active student."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setBrOpen(false)}>
              Close
            </Button>
            <Button onClick={runBulkRemarks} disabled={brLoading || !brForm.className}>
              {brLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {brLoading ? "Generating…" : "Generate remarks"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {configured === false && <ConfigHint />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              value={brForm.className}
              onChange={(e) => setBrForm((f) => ({ ...f, className: e.target.value }))}
              placeholder="Select class"
              options={classOptions}
            />
            <Select
              label="Section (optional)"
              value={brForm.section}
              onChange={(e) => setBrForm((f) => ({ ...f, section: e.target.value }))}
              placeholder="All sections"
              options={sectionOptions}
            />
          </div>
          {brResult && brResult.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{brResult.length} student(s)</p>
                <button
                  type="button"
                  onClick={() =>
                    copy(brResult.map((r) => `${r.name}: ${r.remark}`).join("\n\n"))
                  }
                  className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-hover"
                >
                  <Copy className="size-3.5" />
                  Copy all
                </button>
              </div>
              <ul className="flex flex-col gap-2">
                {brResult.map((r) => (
                  <li key={r.id} className="rounded-md border border-border bg-surface-sunken p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text">{r.name}</p>
                      <button
                        type="button"
                        onClick={() => copy(r.remark)}
                        aria-label={`Copy remark for ${r.name}`}
                        title="Copy remark"
                        className="focus-ring shrink-0 rounded-md p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted">{r.remark}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* Lesson-Plan helper modal */}
      <Modal
        open={lpOpen}
        onOpenChange={setLpOpen}
        title="Lesson-Plan Helper"
        description="Enter the lesson details and generate a structured plan."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setLpOpen(false)}>
              Close
            </Button>
            <Button
              onClick={runLessonPlan}
              disabled={lpLoading || !lpForm.className || !lpForm.subject || !lpForm.topic}
            >
              {lpLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {lpLoading ? "Generating…" : "Generate plan"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {configured === false && <ConfigHint />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              value={lpForm.className}
              onChange={(e) => setLpForm((f) => ({ ...f, className: e.target.value }))}
              placeholder="Select class"
              options={classOptions}
            />
            <Input
              label="Subject"
              value={lpForm.subject}
              onChange={(e) => setLpForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Science"
            />
            <Input
              label="Topic"
              value={lpForm.topic}
              onChange={(e) => setLpForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Photosynthesis"
            />
            <Input
              label="Duration"
              value={lpForm.duration}
              onChange={(e) => setLpForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 45 minutes"
            />
          </div>
          {lpResult && <ResultBlock text={lpResult} onCopy={() => copy(lpResult)} />}
        </div>
      </Modal>
    </div>
  );
}

/** A clickable tool card that opens its modal. */
function ToolCard({
  icon: Icon,
  tone,
  name,
  description,
  action,
  onClick,
}: {
  icon: typeof FileText;
  tone: Tone;
  name: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md text-white shadow-sm", GRADIENTS[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text">{name}</h3>
          <p className="mt-1.5 text-xs text-muted">{description}</p>
        </div>
        <Button variant="outline" className="mt-1 w-full" onClick={onClick}>
          <Sparkles className="size-4" />
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Plain-text result with preserved line breaks and a copy button. */
function ResultBlock({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <div className="rounded-md border border-border bg-surface-sunken">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted">Result</p>
        <button
          type="button"
          onClick={onCopy}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-hover"
        >
          <Copy className="size-3.5" />
          Copy
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto whitespace-pre-wrap px-3 py-3 text-sm text-text">
        {text}
      </div>
    </div>
  );
}

/** Inline hint shown inside tool modals when Gemini isn't connected. */
function ConfigHint() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft/40 px-3 py-2 text-xs text-muted">
      <Info className="mt-0.5 size-4 shrink-0 text-warning-text" />
      <span>
        Gemini isn&apos;t connected, so this tool will return a setup message instead of AI output. Add a{" "}
        <code className="rounded bg-surface-hover px-1 py-0.5">GEMINI_API_KEY</code> on the server to enable it.
      </span>
    </div>
  );
}
