import { api } from "./client";

/** Study material = a file (inline data URL) OR an external link, shared with a class. */
export interface StudyMaterial {
  id?: string;
  title: string;
  type?: string;
  subject?: string;
  klass?: string; // NOTE: `klass`, not class/className
  uploader?: string;
  uploaded?: string;
  sizeMb?: number;
  downloads?: number;
  visibility?: string;
  description?: string;
  tags?: string[];
  url?: string;
  fileDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeLabel?: string;
}
export const listStudyMaterial = () => api<StudyMaterial[]>("/api/study-material?limit=100");
export const createStudyMaterial = (body: Partial<StudyMaterial>) =>
  api<StudyMaterial>("/api/study-material", { method: "POST", body });

/** Syllabus progress per class + subject. */
export interface Syllabus {
  id: string;
  className: string; // NOTE: `className` here
  subject: string;
  teacher?: string;
  academicYear?: string;
  unit?: string;
  chapter?: string;
  topics: number;
  completedTopics: number;
  status?: string;
  date?: string;
}
export const listSyllabus = () => api<Syllabus[]>("/api/syllabus?limit=200");
export const updateSyllabus = (id: string, body: Partial<Syllabus>) =>
  api<Syllabus>(`/api/syllabus/${id}`, { method: "PUT", body });

/** A scheduled / live online class with a join link. */
export interface OnlineClass {
  id?: string;
  topic: string;
  subject?: string;
  teacher?: string;
  klass?: string; // NOTE: `klass`
  platform?: string;
  state?: string;
  when?: string; // free-form, e.g. "Mon 10:00 AM"
  duration?: number;
  attendees?: number;
  link?: string; // meeting URL
  agenda?: string;
}
export const listOnlineClasses = () => api<OnlineClass[]>("/api/online-classes?limit=200");
export const createOnlineClass = (body: Partial<OnlineClass>) =>
  api<OnlineClass>("/api/online-classes", { method: "POST", body });
