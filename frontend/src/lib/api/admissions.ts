import { createResource, textMatch } from "./createResource";

export interface Application {
  id: string;
  applicationNo: string;
  name: string;
  classApplied: string;
  parent: string;
  phone: string;
  source: string;
  appliedOn: string;
  stage: string;
  score: number;
  notes: string;
}

export interface ApplicationFilters {
  search?: string;
  stage?: string;
  classApplied?: string;
  source?: string;
}

/** Ordered funnel. Everything before "rejected" is a forward-moving stage. */
export const PIPELINE = ["enquiry", "applied", "interview", "approved", "rejected"] as const;

export const STAGE_META: Record<
  string,
  { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }
> = {
  enquiry: { label: "Enquiry", variant: "default" },
  applied: { label: "Applied", variant: "info" },
  interview: { label: "Interview", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export const STAGE_OPTIONS = PIPELINE.map((s) => ({ label: STAGE_META[s].label, value: s }));

export const CLASS_APPLIED_OPTIONS = ["Class 1", "Class 4", "Class 6", "Class 9", "Class 11"];

export const SOURCE_OPTIONS = ["Walk-in", "Website", "Referral", "Fair"];

/** The next stage an application can be advanced to, or null at the end. */
export function nextStage(stage: string): string | null {
  const order = ["enquiry", "applied", "interview", "approved"];
  const at = order.indexOf(stage);
  if (at === -1 || at === order.length - 1) return null;
  return order[at + 1];
}

const seed: Application[] = [
  { id: "ADM-2026-001", applicationNo: "ADM-2026-001", name: "Aarav Sharma",    classApplied: "Class 1",  parent: "Rohit Sharma",      phone: "98765-43210", source: "Walk-in",  appliedOn: "2026-01-12", stage: "approved",  score: 88, notes: "Sibling already studying in Class 5." },
  { id: "ADM-2026-002", applicationNo: "ADM-2026-002", name: "Diya Nair",       classApplied: "Class 6",  parent: "Suresh Nair",       phone: "98450-11223", source: "Website",  appliedOn: "2026-01-14", stage: "interview", score: 76, notes: "Interview scheduled with the coordinator." },
  { id: "ADM-2026-003", applicationNo: "ADM-2026-003", name: "Kabir Malhotra",  classApplied: "Class 9",  parent: "Vikas Malhotra",    phone: "99887-65432", source: "Referral", appliedOn: "2026-01-15", stage: "applied",   score: 0,  notes: "Transfer certificate from previous school awaited." },
  { id: "ADM-2026-004", applicationNo: "ADM-2026-004", name: "Ananya Iyer",     classApplied: "Class 11", parent: "Ganesh Iyer",       phone: "90123-45678", source: "Website",  appliedOn: "2026-01-16", stage: "enquiry",   score: 0,  notes: "Enquired about the Science stream." },
  { id: "ADM-2026-005", applicationNo: "ADM-2026-005", name: "Vivaan Reddy",    classApplied: "Class 1",  parent: "Prasad Reddy",      phone: "88990-11223", source: "Walk-in",  appliedOn: "2026-01-18", stage: "approved",  score: 92, notes: "Fee payment link shared with parent." },
  { id: "ADM-2026-006", applicationNo: "ADM-2026-006", name: "Ishita Banerjee", classApplied: "Class 4",  parent: "Arindam Banerjee",  phone: "97654-32109", source: "Referral", appliedOn: "2026-01-19", stage: "rejected",  score: 41, notes: "Entrance score below the cut-off." },
  { id: "ADM-2026-007", applicationNo: "ADM-2026-007", name: "Reyansh Gupta",   classApplied: "Class 6",  parent: "Deepak Gupta",      phone: "96543-21098", source: "Website",  appliedOn: "2026-01-20", stage: "interview", score: 81, notes: "Strong performance in the written test." },
  { id: "ADM-2026-008", applicationNo: "ADM-2026-008", name: "Saanvi Patil",    classApplied: "Class 9",  parent: "Mahesh Patil",      phone: "95432-10987", source: "Fair",     appliedOn: "2026-01-21", stage: "applied",   score: 0,  notes: "Met the team at the Pune education fair." },
  { id: "ADM-2026-009", applicationNo: "ADM-2026-009", name: "Arjun Chauhan",   classApplied: "Class 11", parent: "Bhupendra Chauhan", phone: "94321-09876", source: "Walk-in",  appliedOn: "2026-01-22", stage: "interview", score: 69, notes: "Interested in Commerce with Maths." },
  { id: "ADM-2026-010", applicationNo: "ADM-2026-010", name: "Myra Joshi",      classApplied: "Class 1",  parent: "Nitin Joshi",       phone: "93210-98765", source: "Website",  appliedOn: "2026-01-23", stage: "enquiry",   score: 0,  notes: "Requested a campus tour on a weekend." },
  { id: "ADM-2026-011", applicationNo: "ADM-2026-011", name: "Advik Deshmukh",  classApplied: "Class 4",  parent: "Sameer Deshmukh",   phone: "92109-87654", source: "Referral", appliedOn: "2026-01-24", stage: "approved",  score: 85, notes: "Referred by an existing parent." },
  { id: "ADM-2026-012", applicationNo: "ADM-2026-012", name: "Kiara Menon",     classApplied: "Class 6",  parent: "Ravi Menon",        phone: "91098-76543", source: "Fair",     appliedOn: "2026-01-25", stage: "applied",   score: 0,  notes: "Documents verified, test date pending." },
  { id: "ADM-2026-013", applicationNo: "ADM-2026-013", name: "Atharv Rathore",  classApplied: "Class 9",  parent: "Jitendra Rathore",  phone: "90987-65432", source: "Website",  appliedOn: "2026-01-27", stage: "rejected",  score: 38, notes: "Did not meet the Class 9 admission criteria." },
  { id: "ADM-2026-014", applicationNo: "ADM-2026-014", name: "Aadhya Kulkarni", classApplied: "Class 11", parent: "Shirish Kulkarni",  phone: "89876-54321", source: "Walk-in",  appliedOn: "2026-01-28", stage: "interview", score: 74, notes: "Awaiting Class 10 board result." },
  { id: "ADM-2026-015", applicationNo: "ADM-2026-015", name: "Vihaan Saxena",   classApplied: "Class 1",  parent: "Alok Saxena",       phone: "88765-43210", source: "Referral", appliedOn: "2026-01-29", stage: "enquiry",   score: 0,  notes: "Enquiry received over the phone." },
  { id: "ADM-2026-016", applicationNo: "ADM-2026-016", name: "Anika Bhatt",     classApplied: "Class 4",  parent: "Manoj Bhatt",       phone: "87654-32109", source: "Website",  appliedOn: "2026-02-02", stage: "approved",  score: 90, notes: "Seat confirmed for the new session." },
  { id: "ADM-2026-017", applicationNo: "ADM-2026-017", name: "Shaurya Pillai",  classApplied: "Class 6",  parent: "Anand Pillai",      phone: "86543-21098", source: "Fair",     appliedOn: "2026-02-03", stage: "applied",   score: 0,  notes: "Application form submitted at the stall." },
  { id: "ADM-2026-018", applicationNo: "ADM-2026-018", name: "Navya Choudhary", classApplied: "Class 9",  parent: "Rakesh Choudhary",  phone: "85432-10987", source: "Walk-in",  appliedOn: "2026-02-05", stage: "interview", score: 79, notes: "Parent interview pending." },
];

export const admissionsApi = createResource<Application, ApplicationFilters>({
  idPrefix: "adm",
  seed,
  uniqueBy: { field: "applicationNo", label: "Application number" },
  defaults: { score: 0, stage: "enquiry", notes: "" },
  matches: (row, { search, stage, classApplied, source }) => {
    if (stage && row.stage !== stage) return false;
    if (classApplied && row.classApplied !== classApplied) return false;
    if (source && row.source !== source) return false;
    return textMatch(search, row.name, row.applicationNo, row.parent, row.phone);
  },
});
