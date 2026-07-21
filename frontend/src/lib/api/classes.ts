import { createResource, textMatch } from "./createResource";

export interface SchoolClass {
  id: string;
  name: string;
  sections: string[];
  stream: string;
  classTeacher: string;
  room: string;
  students: number;
  teachers: number;
}

export interface ClassFilters {
  search?: string;
  stream?: string;
}

export const STREAM_OPTIONS = ["General", "Science", "Commerce", "Arts", "Science/Commerce"];
export const SECTION_OPTIONS = ["A", "B", "C", "D"];

const seed: SchoolClass[] = [
  { id: "cls_001", name: "Class 6", sections: ["A", "B", "C"], students: 165, teachers: 8, classTeacher: "Ms. Anita Patel", room: "101-103", stream: "General" },
  { id: "cls_002", name: "Class 7", sections: ["A", "B"], students: 142, teachers: 7, classTeacher: "Mr. Suresh Kumar", room: "104-105", stream: "General" },
  { id: "cls_003", name: "Class 8", sections: ["A", "B", "C"], students: 178, teachers: 9, classTeacher: "Ms. Kavita Singh", room: "106-108", stream: "General" },
  { id: "cls_004", name: "Class 9", sections: ["A", "B"], students: 160, teachers: 10, classTeacher: "Mr. Rahul Verma", room: "201-202", stream: "General" },
  { id: "cls_005", name: "Class 10", sections: ["A", "B", "C"], students: 185, teachers: 11, classTeacher: "Dr. Priya Sharma", room: "203-205", stream: "General" },
  { id: "cls_006", name: "Class 11", sections: ["A", "B"], students: 148, teachers: 12, classTeacher: "Ms. Deepa Nair", room: "301-302", stream: "Science/Commerce" },
  { id: "cls_007", name: "Class 12", sections: ["A", "B"], students: 140, teachers: 12, classTeacher: "Mr. Amit Joshi", room: "303-304", stream: "Science/Commerce" },
];

export const classesApi = createResource<SchoolClass, ClassFilters>({
  idPrefix: "cls",
  seed,
  uniqueBy: { field: "name", label: "Class name" },
  defaults: { students: 0, teachers: 0 },
  matches: (row, { search, stream }) => {
    if (stream && row.stream !== stream) return false;
    return textMatch(search, row.name, row.classTeacher, row.room, row.stream);
  },
});
