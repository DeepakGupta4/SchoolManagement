import type { Router } from "express";
import classRoutes from "./classes/class.routes.js";
import subjectRoutes from "./subjects/subject.routes.js";
import examRoutes from "./exams/exam.routes.js";
import examScheduleRoutes from "./examSchedule/examSchedule.routes.js";
import assignmentRoutes from "./assignments/assignment.routes.js";
import onlineClassRoutes from "./onlineClasses/onlineClass.routes.js";
import studyMaterialRoutes from "./studyMaterial/studyMaterial.routes.js";
import admissionRoutes from "./admissions/admission.routes.js";
import alumnusRoutes from "./alumni/alumnus.routes.js";
import transferRoutes from "./transfers/transfer.routes.js";
import staffRoutes from "./staff/staff.routes.js";
import departmentRoutes from "./departments/department.routes.js";
import allocationRoutes from "./allocations/allocation.routes.js";
import feeStructureRoutes from "./feeStructures/feeStructure.routes.js";
import scholarshipRoutes from "./scholarships/scholarship.routes.js";
import expenseRoutes from "./expenses/expense.routes.js";
import bookRoutes from "./books/book.routes.js";
import busRouteRoutes from "./busRoutes/busRoute.routes.js";
import hostelStudentRoutes from "./hostelStudents/hostelStudent.routes.js";
import inventoryItemRoutes from "./inventory/inventoryItem.routes.js";
import labRoutes from "./labs/lab.routes.js";
import medicineRoutes from "./medicines/medicine.routes.js";
import patientRoutes from "./patients/patient.routes.js";
import menuItemRoutes from "./menuItems/menuItem.routes.js";
import visitorRoutes from "./visitors/visitor.routes.js";
import certificateRoutes from "./certificates/certificate.routes.js";
import eventRoutes from "./events/event.routes.js";
import jobPostingRoutes from "./jobPostings/jobPosting.routes.js";
import announcementRoutes from "./announcements/announcement.routes.js";
import noticeRoutes from "./notices/notice.routes.js";
import leaveRequestRoutes from "./leaveRequests/leaveRequest.routes.js";
import payrollRoutes from "./payroll/payroll.routes.js";
import studentDocumentRoutes from "./studentDocuments/studentDocument.routes.js";
import timetableRoutes from "./timetable/timetable.routes.js";
import syllabusRoutes from "./syllabus/syllabus.routes.js";
import messageRoutes from "./messages/message.routes.js";
import workflowRoutes from "./workflows/workflow.routes.js";

/**
 * Tenant CRUD modules mounted uniformly under the subscription guard. Each is a
 * `createCrudRouter` router. Adding a module is a single line here — app.ts
 * iterates and mounts them all with the same auth + subscription gating.
 */
export const crudModules: { path: string; router: Router }[] = [
  { path: "/api/classes", router: classRoutes },
  { path: "/api/subjects", router: subjectRoutes },
  { path: "/api/exams", router: examRoutes },
  { path: "/api/exam-schedule", router: examScheduleRoutes },
  { path: "/api/assignments", router: assignmentRoutes },
  { path: "/api/online-classes", router: onlineClassRoutes },
  { path: "/api/study-material", router: studyMaterialRoutes },
  { path: "/api/admissions", router: admissionRoutes },
  { path: "/api/alumni", router: alumnusRoutes },
  { path: "/api/transfers", router: transferRoutes },
  { path: "/api/staff", router: staffRoutes },
  { path: "/api/departments", router: departmentRoutes },
  { path: "/api/allocations", router: allocationRoutes },
  { path: "/api/fee-structures", router: feeStructureRoutes },
  { path: "/api/scholarships", router: scholarshipRoutes },
  { path: "/api/expenses", router: expenseRoutes },
  { path: "/api/books", router: bookRoutes },
  { path: "/api/bus-routes", router: busRouteRoutes },
  { path: "/api/hostel-students", router: hostelStudentRoutes },
  { path: "/api/inventory", router: inventoryItemRoutes },
  { path: "/api/labs", router: labRoutes },
  { path: "/api/medicines", router: medicineRoutes },
  { path: "/api/patients", router: patientRoutes },
  { path: "/api/menu-items", router: menuItemRoutes },
  { path: "/api/visitors", router: visitorRoutes },
  { path: "/api/certificates", router: certificateRoutes },
  { path: "/api/events", router: eventRoutes },
  { path: "/api/job-postings", router: jobPostingRoutes },
  { path: "/api/announcements", router: announcementRoutes },
  { path: "/api/notices", router: noticeRoutes },
  { path: "/api/leave-requests", router: leaveRequestRoutes },
  { path: "/api/payroll", router: payrollRoutes },
  { path: "/api/student-documents", router: studentDocumentRoutes },
  { path: "/api/timetable", router: timetableRoutes },
  { path: "/api/syllabus", router: syllabusRoutes },
  { path: "/api/messages", router: messageRoutes },
  { path: "/api/workflows", router: workflowRoutes },
];
