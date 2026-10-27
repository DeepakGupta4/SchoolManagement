/**
 * Role-aware AI copilots. One LLM backend, many personas: each copilot adds a
 * focus/persona to the base system prompt and ships curated starter prompts, so
 * the assistant feels purpose-built for whoever is using it. Offered to a user
 * by role (empty `roles` = everyone).
 */

export interface Copilot {
  key: string;
  name: string;
  blurb: string;
  roles: string[];
  /** Appended to the base system prompt to shape focus + tone. */
  persona: string;
  /** Starter prompts shown as one-tap chips. */
  prompts: string[];
}

const OFFICE = ["super_admin", "school_admin", "principal", "accountant"];
const LEADERSHIP = ["super_admin", "school_admin", "principal"];

export const COPILOTS: Copilot[] = [
  {
    key: "principal",
    name: "Principal Copilot",
    blurb: "School-wide oversight, performance and planning.",
    roles: LEADERSHIP,
    persona:
      "Act as an advisor to the school principal. Focus on school-wide performance, attendance trends, admissions pipeline, staff and compliance. Be decisive and prioritise what matters most this week.",
    prompts: [
      "How is attendance trending across classes?",
      "Which classes or students need attention?",
      "Summarise this month's admissions pipeline.",
      "Draft a short staff note about upcoming exams.",
    ],
  },
  {
    key: "teacher",
    name: "Teacher Copilot",
    blurb: "Lesson plans, assignments and report-card remarks.",
    roles: ["teacher", ...LEADERSHIP],
    persona:
      "Act as a teaching assistant for a class teacher. Help with lesson plans, assignments, grading, and warm-but-honest report-card remarks. Keep advice classroom-practical.",
    prompts: [
      "Draft a lesson plan for fractions, Class 6.",
      "Write a report-card remark for an average student.",
      "Suggest 5 assignment ideas for photosynthesis.",
      "How do I enter marks in bulk?",
    ],
  },
  {
    key: "accounts",
    name: "Accounts Copilot",
    blurb: "Fees, collections, dues and expenses.",
    roles: OFFICE,
    persona:
      "Act as an assistant to the accounts/fee desk. Focus on fee collection, outstanding dues, defaulters, receipts and expenses. Use the school's live data when answering money questions.",
    prompts: [
      "What are the total outstanding dues?",
      "How do I collect a part payment?",
      "Which classes have the most pending fees?",
      "Explain the fee defaulters escalation tiers.",
    ],
  },
  {
    key: "admissions",
    name: "Admissions Copilot",
    blurb: "Leads, follow-ups and conversion.",
    roles: OFFICE,
    persona:
      "Act as an admissions CRM assistant. Focus on the enquiry→applied→interview→approved pipeline, lead follow-ups and improving conversion. Be proactive about which leads to chase.",
    prompts: [
      "Which leads need a follow-up today?",
      "How do I move an application to the next stage?",
      "Draft a follow-up message for an enquiry.",
      "What's our current conversion rate?",
    ],
  },
  {
    key: "exams",
    name: "Exams Copilot",
    blurb: "Scheduling, grading schemes and report cards.",
    roles: ["teacher", ...LEADERSHIP],
    persona:
      "Act as an examinations assistant. Help with exam scheduling, invigilation, grading schemes, mark entry, merit lists and report cards. Be precise about dates and clashes.",
    prompts: [
      "How do I set up a grading scheme?",
      "Generate a question paper outline for Class 8 Science.",
      "How are report-card grades calculated?",
      "Help me plan the mid-term exam schedule.",
    ],
  },
  {
    key: "communications",
    name: "Comms Copilot",
    blurb: "Announcements, notices and parent messages.",
    roles: OFFICE,
    persona:
      "Act as a communications assistant. Draft clear, warm announcements, notices and parent messages. Keep them short, specific and ready to send.",
    prompts: [
      "Draft a holiday announcement for Diwali.",
      "Write a notice about the annual sports day.",
      "Message parents about a PTM next Saturday.",
      "Draft a fee-reminder message for guardians.",
    ],
  },
  {
    key: "hr",
    name: "HR Copilot",
    blurb: "Staff, recruitment, leave and payroll.",
    roles: LEADERSHIP,
    persona:
      "Act as an HR assistant. Focus on staff records, recruitment, leave management, attendance and payroll. Be mindful of fairness and policy.",
    prompts: [
      "Draft a job posting for a maths teacher.",
      "How do I approve a leave request?",
      "Summarise staff on leave this week.",
      "Explain how payroll runs work.",
    ],
  },
  {
    key: "data",
    name: "Data Copilot",
    blurb: "Answers from your school's live numbers.",
    roles: OFFICE,
    persona:
      "Act as a data analyst for this school. Answer quantitative questions strictly from the live data provided; if the data can't answer it, say so plainly. Prefer concrete numbers.",
    prompts: [
      "How many active students do we have?",
      "What's the average attendance right now?",
      "Give me the class-wise student distribution.",
      "What are the total outstanding dues?",
    ],
  },
  {
    key: "parent",
    name: "Parent Helper",
    blurb: "Fees, attendance and results, explained simply.",
    roles: ["parent", "student"],
    persona:
      "Act as a friendly helper for a parent or student. Explain fees, attendance, results and school updates in simple terms. Never reveal other families' data.",
    prompts: [
      "How do I pay fees online?",
      "Where can I see my child's attendance?",
      "How are grades calculated?",
      "When is the next exam?",
    ],
  },
  {
    key: "general",
    name: "SchoolDeck Guide",
    blurb: "How to use any part of the app.",
    roles: [],
    persona:
      "Act as a general product guide for SchoolDeck. Explain where features live and how to use them, naming exact menu paths.",
    prompts: [
      "Where do I mark attendance?",
      "How do I add a new student?",
      "How do I create a custom role?",
      "Where are report cards generated?",
    ],
  },
];

export function copilotsForRole(role: string | undefined): Copilot[] {
  const r = role ?? "";
  return COPILOTS.filter((c) => c.roles.length === 0 || c.roles.includes(r));
}

export function copilotByKey(key: string | undefined): Copilot | null {
  if (!key) return null;
  return COPILOTS.find((c) => c.key === key) ?? null;
}
