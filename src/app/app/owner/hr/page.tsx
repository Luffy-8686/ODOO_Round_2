"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import {
  UserCheck,
  Clock,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle2,
  XCircle,
  Printer,
  ShieldCheck,
} from "lucide-react";

export default function OwnerHrPayrollPage() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"EMPLOYEES" | "LEAVES" | "PAYROLL">("PAYROLL");
  const [loading, setLoading] = useState(true);

  const fetchHrData = async () => {
    setLoading(true);
    try {
      const [empRes, levRes, payRes] = await Promise.all([
        fetch("/api/hr?view=employees"),
        fetch("/api/hr?view=leaves"),
        fetch("/api/hr?view=payroll"),
      ]);
      const empData = await empRes.json();
      const levData = await levRes.json();
      const payData = await payRes.json();

      if (empData.employees) setEmployees(empData.employees);
      if (levData.leaves) setLeaves(levData.leaves);
      if (payData.payrolls) setPayrolls(payData.payrolls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, []);

  const handleLeaveDecision = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LEAVE_DECISION",
          leaveId,
          status,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchHrData();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleRunPayroll = async () => {
    if (!confirm("Run monthly payroll for all active staff and record in ledger?")) return;

    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_PAYROLL" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Payroll processed successfully and payslips generated!");
        fetchHrData();
        setActiveTab("PAYROLL");
      }
    } catch (e: any) {
      alert("Payroll error: " + e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Executive HR, Staff Salaries & Payroll
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200">
              OWNER PRIVILEGE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Staff compensation governance, shift attendance, leave approvals, and automated monthly payroll disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPayroll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Process Monthly Payroll Run</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-fit">
        {["PAYROLL", "EMPLOYEES", "LEAVES"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {tab === "EMPLOYEES"
              ? `Staff & Salaries (${employees.length})`
              : tab === "LEAVES"
              ? `Leave Requests (${leaves.length})`
              : `Payslips & Runs (${payrolls.length})`}
          </button>
        ))}
      </div>

      {/* PAYROLL RUNS & PAYSLIPS */}
      {activeTab === "PAYROLL" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Processed Payroll Disbursals</h3>
          <div className="space-y-4">
            {payrolls.map((pr) => (
              <div key={pr.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-600 text-sm">{pr.payrollNumber}</span>
                  <span className="font-bold text-emerald-600 text-sm">Total Disbursed: {formatINR(pr.totalNetPaise)}</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700 pt-2">
                  {pr.payslips?.map((ps: any) => (
                    <div key={ps.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{ps.employee?.name}</span>
                        <span className="text-[10px] text-slate-400 block">Payslip #{ps.payslipNumber}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold">{formatINR(ps.netSalaryPaise)}</span>
                        <button
                          onClick={() => window.print()}
                          className="p-1 rounded border hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPLOYEES DIRECTORY WITH SALARY VISIBILITY */}
      {activeTab === "EMPLOYEES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-600">{emp.employeeCode}</span>
                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800">
                  {emp.role}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{emp.name}</h4>
                <span className="text-slate-500 text-[11px] block">{emp.email} • {emp.phone}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Monthly Salary:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {emp.monthlySalaryPaise ? formatINR(emp.monthlySalaryPaise) : "Restricted"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEAVE APPROVAL WORKFLOW */}
      {activeTab === "LEAVES" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Leave Requests & Executive Approvals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold">{l.employee?.name}</td>
                    <td className="p-3">{l.leaveType}</td>
                    <td className="p-3 text-slate-500">
                      {formatDate(l.startDate)} – {formatDate(l.endDate)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{l.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          l.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : l.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {l.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleLeaveDecision(l.id, "APPROVED")}
                            className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLeaveDecision(l.id, "REJECTED")}
                            className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
