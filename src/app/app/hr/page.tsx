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

export default function HrPayrollPage() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"EMPLOYEES" | "LEAVES" | "PAYROLL">("EMPLOYEES");
  const [loading, setLoading] = useState(true);

  // Leave Request State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Human Resources, Roster & Staff Payroll
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 font-bold">
              {employees.length} ACTIVE STAFF
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Athletic staff shifts, attendance tracking, leave governance, and automated monthly payroll disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPayroll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white text-xs font-serif uppercase tracking-wider font-semibold shadow-xs transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Process Monthly Payroll</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] p-1 rounded-xl text-xs w-fit">
        {["EMPLOYEES", "LEAVES", "PAYROLL"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3.5 py-1.5 rounded-lg font-serif uppercase tracking-wider text-[11px] transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-[#0B1320] text-[#0B1320] dark:text-[#FAF8F5] shadow-xs font-bold border border-[#E5DFD5] dark:border-[#223042]"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            }`}
          >
            {tab === "EMPLOYEES"
              ? `Staff Directory (${employees.length})`
              : tab === "LEAVES"
              ? `Leave Requests (${leaves.length})`
              : `Payroll Disbursals (${payrolls.length})`}
          </button>
        ))}
      </div>

      {/* EMPLOYEES DIRECTORY */}
      {activeTab === "EMPLOYEES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-3 text-xs hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#C5A059]">{emp.employeeCode}</span>
                <span className="px-2.5 py-0.5 rounded font-mono font-bold uppercase text-[10px] tracking-wider bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] text-stone-600 dark:text-stone-400">
                  {emp.role}
                </span>
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">{emp.name}</h4>
                <span className="text-stone-500 font-mono text-[11px] block mt-0.5">{emp.email} • {emp.phone}</span>
              </div>
              <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#223042] flex items-center justify-between">
                <span className="text-stone-400 font-serif uppercase tracking-wider text-[10px]">Monthly Compensation:</span>
                <span className="font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] text-sm">{formatINR(emp.monthlySalaryPaise)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEAVE APPROVAL WORKFLOW */}
      {activeTab === "LEAVES" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
            Staff Leave Requests & Governance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-medium">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400 font-mono italic">
                      No leave requests found in the system.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                      <td className="p-3.5 font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">
                        {l.employee?.name}
                      </td>
                      <td className="p-3.5 font-semibold text-stone-700 dark:text-stone-300">{l.leaveType}</td>
                      <td className="p-3.5 font-mono text-stone-500 dark:text-stone-400">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">{l.reason}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded font-mono font-bold uppercase text-[10px] tracking-wider border ${
                            l.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                              : l.status === "PENDING"
                              ? "bg-[#C5A059]/15 text-[#8C6D2D] border-[#C5A059]/30 dark:text-[#C5A059]"
                              : "bg-[#921111]/15 text-[#921111] border-[#921111]/30 dark:text-[#e05252]"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {l.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleLeaveDecision(l.id, "APPROVED")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-serif uppercase tracking-wider font-bold text-xs shadow-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(l.id, "REJECTED")}
                              className="px-3 py-1.5 rounded-lg bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider font-bold text-xs shadow-xs transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYROLL RUNS & PAYSLIPS */}
      {activeTab === "PAYROLL" && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
            Processed Payroll Disbursals
          </h3>
          <div className="space-y-4">
            {payrolls.length === 0 ? (
              <div className="p-8 text-center text-stone-400 font-mono italic">
                No payroll runs processed yet.
              </div>
            ) : (
              payrolls.map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5] dark:border-[#223042]">
                    <span className="font-mono font-bold text-[#C5A059] text-sm">{pr.payrollNumber}</span>
                    <span className="font-serif font-bold text-[#921111] dark:text-[#C5A059] text-sm">
                      Total Disbursed: {formatINR(pr.totalNetPaise)}
                    </span>
                  </div>
                  <div className="divide-y divide-[#E5DFD5] dark:divide-[#223042] pt-1">
                    {pr.payslips?.map((ps: any) => (
                      <div key={ps.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5] block">
                            {ps.employee?.name}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                            Payslip #{ps.payslipNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">
                            {formatINR(ps.netSalaryPaise)}
                          </span>
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg border border-[#E5DFD5] dark:border-[#223042] hover:bg-white dark:hover:bg-[#0B1320] text-stone-600 dark:text-stone-300"
                            title="Print Payslip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
