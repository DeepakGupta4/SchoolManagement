/**
 * Fee receipts and defaulter records.
 *
 * These are still fixtures rather than a `createResource` CRUD entity, but they
 * live here — not inside a page — so that the fee overview, the receipts page
 * and the defaulters page all count the same rows. Previously each page carried
 * its own copy and the headline figures disagreed with the pages they link to.
 */

export interface FeeReceipt {
  id: string;
  student: string;
  class: string;
  feeType: string;
  amount: number;
  method: string;
  date: string;
  /** "paid" | "pending" | "cancelled" */
  status: string;
  txnId: string;
}

export const FEE_RECEIPTS: FeeReceipt[] = [
  { id: "RCP001", student: "Arjun Sharma",   class: "10-A", feeType: "Tuition Fee",   amount: 5450,  method: "Online",  date: "Jul 18, 2025", status: "paid",    txnId: "TXN8821" },
  { id: "RCP002", student: "Priya Patel",    class: "9-B",  feeType: "Full Fee",       amount: 10900, method: "Cash",    date: "Jul 17, 2025", status: "paid",    txnId: "TXN8820" },
  { id: "RCP003", student: "Rahul Verma",    class: "11-A", feeType: "Tuition Fee",   amount: 6900,  method: "Cheque",  date: "Jul 16, 2025", status: "pending", txnId: "TXN8819" },
  { id: "RCP004", student: "Sneha Gupta",    class: "8-B",  feeType: "Full Fee",       amount: 8800,  method: "Online",  date: "Jul 15, 2025", status: "paid",    txnId: "TXN8818" },
  { id: "RCP005", student: "Karan Mehta",    class: "12-A", feeType: "Transport Fee", amount: 1500,  method: "UPI",     date: "Jul 14, 2025", status: "paid",    txnId: "TXN8817" },
  { id: "RCP006", student: "Ananya Singh",   class: "7-A",  feeType: "Tuition Fee",   amount: 4400,  method: "Cash",    date: "Jul 13, 2025", status: "paid",    txnId: "TXN8816" },
  { id: "RCP007", student: "Vikram Joshi",   class: "6-B",  feeType: "Lab Fee",        amount: 500,   method: "Online",  date: "Jul 12, 2025", status: "cancelled", txnId: "TXN8815" },
  { id: "RCP008", student: "Meera Nair",     class: "11-B", feeType: "Full Fee",       amount: 13800, method: "DD",      date: "Jul 11, 2025", status: "paid",    txnId: "TXN8814" },
  { id: "RCP009", student: "Rohan Das",      class: "9-A",  feeType: "Sports Fee",    amount: 700,   method: "Cash",    date: "Jul 10, 2025", status: "paid",    txnId: "TXN8813" },
  { id: "RCP010", student: "Kavya Reddy",    class: "12-B", feeType: "Tuition Fee",   amount: 9000,  method: "Online",  date: "Jul 09, 2025", status: "pending", txnId: "TXN8812" },
];

export interface FeeDefaulter {
  id: string;
  name: string;
  class: string;
  parent: string;
  phone: string;
  totalFee: number;
  paid: number;
  due: number;
  /** Months of unpaid dues. */
  months: number;
  lastPaid: string;
}

export const FEE_DEFAULTERS: FeeDefaulter[] = [
  { id: "STU005", name: "Karan Mehta",     class: "12-A", parent: "Suresh Mehta",   phone: "98765-43210", totalFee: 13800, paid: 0,     due: 13800, months: 3, lastPaid: "Apr 2025" },
  { id: "STU011", name: "Deepak Yadav",    class: "10-B", parent: "Ramesh Yadav",   phone: "87654-32109", totalFee: 10900, paid: 2725,  due: 8175,  months: 2, lastPaid: "May 2025" },
  { id: "STU018", name: "Pooja Sharma",    class: "9-A",  parent: "Anil Sharma",    phone: "76543-21098", totalFee: 10900, paid: 5450,  due: 5450,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU023", name: "Amit Tiwari",     class: "11-B", parent: "Rajesh Tiwari",  phone: "65432-10987", totalFee: 13800, paid: 4600,  due: 9200,  months: 2, lastPaid: "May 2025" },
  { id: "STU031", name: "Sunita Devi",     class: "8-A",  parent: "Mohan Devi",     phone: "54321-09876", totalFee: 8800,  paid: 2200,  due: 6600,  months: 3, lastPaid: "Apr 2025" },
  { id: "STU042", name: "Ravi Kumar",      class: "7-B",  parent: "Sunil Kumar",    phone: "43210-98765", totalFee: 8800,  paid: 4400,  due: 4400,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU055", name: "Nisha Pandey",    class: "6-A",  parent: "Vinod Pandey",   phone: "32109-87654", totalFee: 6500,  paid: 0,     due: 6500,  months: 3, lastPaid: "Never"    },
  { id: "STU067", name: "Gaurav Singh",    class: "12-B", parent: "Harish Singh",   phone: "21098-76543", totalFee: 13800, paid: 6900,  due: 6900,  months: 1, lastPaid: "Jun 2025" },
];
