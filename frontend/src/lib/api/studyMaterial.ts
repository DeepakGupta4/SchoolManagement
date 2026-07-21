import { createResource, textMatch } from "./createResource";

export interface Material {
  id: string;
  title: string;
  type: string;
  subject: string;
  klass: string;
  uploader: string;
  uploaded: string;
  sizeMb: number;
  downloads: number;
  visibility: string;
  description: string;
  tags: string[];
}

export interface MaterialFilters {
  search?: string;
  type?: string;
  subject?: string;
  klass?: string;
}

export const TYPE_OPTIONS = [
  { label: "PDF", value: "pdf" },
  { label: "Video", value: "video" },
  { label: "Notes", value: "notes" },
];

export const VISIBILITY_OPTIONS = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
];

export const SUBJECT_OPTIONS = [
  "Accountancy", "Biology", "Chemistry", "Computer Science", "Electronics",
  "English", "French", "Hindi", "History", "Mathematics", "Physics", "Sanskrit",
];

export const CLASS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];

export const UPLOADER_OPTIONS = [
  "Dr. Priya Sharma", "Mr. Amit Joshi", "Mr. Naveen Chawla", "Mr. Rahul Verma",
  "Mr. Rakesh Yadav", "Mr. Suresh Kumar", "Ms. Anita Patel", "Ms. Deepa Nair",
  "Ms. Elena D'Souza", "Ms. Kavita Singh", "Ms. Lata Trivedi", "Ms. Meenakshi Rao",
  "Ms. Ritu Bansal",
];

/** Curriculum tags used to group material across subjects. */
export const TAG_OPTIONS = [
  "Board exam",
  "Revision",
  "Homework",
  "Practical",
  "Reference",
];

const seed: Material[] = [
  { id: "M01", title: "Quadratic Equations — Worksheet 4",  type: "pdf",   subject: "Mathematics",      klass: "X",    uploader: "Dr. Priya Sharma",  uploaded: "21 Jul 2026", sizeMb: 2.4, downloads: 486, visibility: "published", description: "Twenty graded problems on roots and the discriminant.", tags: ["Homework", "Board exam"] },
  { id: "M02", title: "Wave Optics — Video Lecture 6",      type: "video", subject: "Physics",          klass: "XII",  uploader: "Mr. Rahul Verma",   uploaded: "20 Jul 2026", sizeMb: 184, downloads: 312, visibility: "published", description: "Full lecture on interference and Young's experiment.",  tags: ["Board exam"] },
  { id: "M03", title: "The Monsoon — Model Essays",         type: "notes", subject: "English",          klass: "IX",   uploader: "Ms. Anita Patel",   uploaded: "20 Jul 2026", sizeMb: 1.1, downloads: 528, visibility: "published", description: "Three model descriptive essays with examiner notes.",   tags: ["Reference"] },
  { id: "M04", title: "Organic Chemistry — Alkanes Notes",  type: "notes", subject: "Chemistry",        klass: "XI",   uploader: "Ms. Kavita Singh",  uploaded: "19 Jul 2026", sizeMb: 3.8, downloads: 274, visibility: "published", description: "Nomenclature, preparation and reactions of alkanes.",   tags: ["Revision"] },
  { id: "M05", title: "Python Loops — Practice Set",        type: "pdf",   subject: "Computer Science", klass: "X",    uploader: "Mr. Amit Joshi",    uploaded: "19 Jul 2026", sizeMb: 1.7, downloads: 391, visibility: "published", description: "Thirty programs covering loops and functions.",          tags: ["Practical", "Homework"] },
  { id: "M06", title: "Genetics — Mendel's Laws Recording", type: "video", subject: "Biology",          klass: "XII",  uploader: "Ms. Deepa Nair",    uploaded: "18 Jul 2026", sizeMb: 226, downloads: 198, visibility: "published", description: "Recorded class on monohybrid and dihybrid crosses.",     tags: ["Board exam", "Revision"] },
  { id: "M07", title: "Mughal Empire — Chapter Summary",    type: "notes", subject: "History",          klass: "IX",   uploader: "Mr. Suresh Kumar",  uploaded: "18 Jul 2026", sizeMb: 0.9, downloads: 415, visibility: "published", description: "One-page summary from Babur to the empire's decline.",   tags: ["Revision"] },
  { id: "M08", title: "Hindi Sandhi — Abhyas Patra",        type: "pdf",   subject: "Hindi",            klass: "VII",  uploader: "Ms. Meenakshi Rao", uploaded: "17 Jul 2026", sizeMb: 1.3, downloads: 462, visibility: "published", description: "Practice sheet on swar and vyanjan sandhi.",             tags: ["Homework"] },
  { id: "M09", title: "Ledger Posting — Solved Examples",   type: "pdf",   subject: "Accountancy",      klass: "XII",  uploader: "Ms. Ritu Bansal",   uploaded: "17 Jul 2026", sizeMb: 2.9, downloads: 176, visibility: "published", description: "Fifteen solved journal-to-ledger problems.",             tags: ["Board exam"] },
  { id: "M10", title: "Trigonometry — Formula Sheet",       type: "notes", subject: "Mathematics",      klass: "X",    uploader: "Mr. Rakesh Yadav",  uploaded: "16 Jul 2026", sizeMb: 0.6, downloads: 604, visibility: "published", description: "All Class 10 identities on a single printable page.",    tags: ["Revision", "Reference"] },
  { id: "M11", title: "Thermodynamics — Numericals",        type: "pdf",   subject: "Physics",          klass: "XI",   uploader: "Mr. Rahul Verma",   uploaded: "16 Jul 2026", sizeMb: 2.2, downloads: 243, visibility: "published", description: "First-law numericals with step-by-step solutions.",      tags: ["Homework"] },
  { id: "M12", title: "French Greetings — Audio Notes",     type: "video", subject: "French",           klass: "XI",   uploader: "Ms. Elena D'Souza", uploaded: "15 Jul 2026", sizeMb: 96,  downloads: 68,  visibility: "published", description: "Pronunciation guide for salutations and numbers.",       tags: ["Reference"] },
  { id: "M13", title: "Cell Structure — Labelled Diagrams", type: "pdf",   subject: "Biology",          klass: "XI",   uploader: "Ms. Deepa Nair",    uploaded: "15 Jul 2026", sizeMb: 5.4, downloads: 289, visibility: "published", description: "High-resolution organelle diagrams for the lab record.", tags: ["Practical"] },
  { id: "M14", title: "Sanskrit Shloka — Recitation Guide", type: "notes", subject: "Sanskrit",         klass: "VIII", uploader: "Ms. Lata Trivedi",  uploaded: "14 Jul 2026", sizeMb: 0.8, downloads: 121, visibility: "draft",     description: "Meter and pronunciation notes for the annual recital.",  tags: ["Reference"] },
  { id: "M15", title: "Robotics — Sensor Basics Slides",    type: "pdf",   subject: "Electronics",      klass: "IX",   uploader: "Mr. Naveen Chawla", uploaded: "14 Jul 2026", sizeMb: 8.6, downloads: 54,  visibility: "draft",     description: "Slide deck on IR and ultrasonic sensor wiring.",         tags: ["Practical"] },
  { id: "M16", title: "Business Studies — Case Studies",    type: "notes", subject: "Accountancy",      klass: "XII",  uploader: "Ms. Ritu Bansal",   uploaded: "13 Jul 2026", sizeMb: 2.1, downloads: 137, visibility: "published", description: "Six Indian business case studies with questions.",       tags: ["Reference", "Board exam"] },
  { id: "M17", title: "Algebra Revision — Whiteboard Clip", type: "video", subject: "Mathematics",      klass: "IX",   uploader: "Mr. Rakesh Yadav",  uploaded: "12 Jul 2026", sizeMb: 143, downloads: 205, visibility: "published", description: "Whiteboard walkthrough of linear equation methods.",     tags: ["Revision"] },
  { id: "M18", title: "Civics — Constitution Handout",      type: "pdf",   subject: "History",          klass: "IX",   uploader: "Mr. Suresh Kumar",  uploaded: "12 Jul 2026", sizeMb: 1.9, downloads: 348, visibility: "published", description: "Preamble, fundamental rights and duties handout.",       tags: ["Reference"] },
];

export const studyMaterialApi = createResource<Material, MaterialFilters>({
  idPrefix: "mat",
  seed,
  uniqueBy: { field: "title", label: "Title" },
  defaults: { downloads: 0, visibility: "draft", tags: [] },
  matches: (row, { search, type, subject, klass }) => {
    if (type && row.type !== type) return false;
    if (subject && row.subject !== subject) return false;
    if (klass && row.klass !== klass) return false;
    return textMatch(search, row.title, row.subject, row.uploader);
  },
});
