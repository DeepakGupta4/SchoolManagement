"use client";
import React, { useState } from "react";
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const students = [
  { id: "S001", name: "Aarav Sharma", class: "10-A", roll: 1, gender: "Male", fees: "Paid", attendance: 94, phone: "98765XXXXX", status: "active" },
  { id: "S002", name: "Priya Patel", class: "10-A", roll: 2, gender: "Female", fees: "Paid", attendance: 98, phone: "87654XXXXX", status: "active" },
  { id: "S003", name: "Rohan Verma", class: "9-B", roll: 5, gender: "Male", fees: "Pending", attendance: 72, phone: "76543XXXXX", status: "active" },
  { id: "S004", name: "Sneha Gupta", class: "11-C", roll: 12, gender: "Female", fees: "Paid", attendance: 88, phone: "65432XXXXX", status: "active" },
  { id: "S005", name: "Karan Singh", class: "8-A", roll: 3, gender: "Male", fees: "Overdue", attendance: 65, phone: "54321XXXXX", status: "inactive" },
  { id: "S006", name: "Ananya Joshi", class: "12-B", roll: 8, gender: "Female", fees: "Paid", attendance: 96, phone: "43210XXXXX", status: "active" },
  { id: "S007", name: "Vikram Nair", class: "7-A", roll: 15, gender: "Male", fees: "Pending", attendance: 80, phone: "32109XXXXX", status: "active" },
  { id: "S008", name: "Meera Iyer", class: "6-B", roll: 7, gender: "Female", fees: "Paid", attendance: 91, phone: "21098XXXXX", status: "active" },
];

const feeColor: Record<string, "success" | "warning" | "danger"> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
    const matchClass = classFilter === "All" || s.class.startsWith(classFilter);
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all student records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Download size={14} /> Export</Button>
          <Button size="sm"><Plus size={14} /> Add Student</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: "1,240", color: "text-indigo-600" },
          { label: "Active", value: "1,198", color: "text-emerald-600" },
          { label: "Fee Defaulters", value: "42", color: "text-red-500" },
          { label: "Avg Attendance", value: "91.4%", color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {["All", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
              <option key={c}>{c === "All" ? "All Classes" : `Class ${c}`}</option>
            ))}
          </select>
          <Button variant="outline" size="sm"><Filter size={14} /> More Filters</Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Student", "Class", "Roll No", "Attendance", "Fee Status", "Contact", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
                        <GraduationCap size={15} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{s.class}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{s.roll}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.attendance >= 90 ? "bg-emerald-500" : s.attendance >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${s.attendance}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{s.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={feeColor[s.fees]}>{s.fees}</Badge>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{s.phone}</td>
                  <td className="px-6 py-3">
                    <Badge variant={s.status === "active" ? "success" : "default"}>{s.status}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"><Eye size={14} /></button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"><Edit size={14} /></button>
                      <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No students found</div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {students.length} students</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 12].map((p, i) => (
              <button key={i} className={`w-7 h-7 text-xs rounded-lg transition-colors ${p === 1 ? "bg-indigo-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
