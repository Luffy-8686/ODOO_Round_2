"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDateTime, formatDate } from "@/lib/formatters";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function OwnerFinancePage() {
  const [activeTab, setActiveTab] = useState<"LEDGER" | "INVOICES" | "EXPENSES" | "TAX">("LEDGER");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, invRes, expRes, taxRes] = await Promise.all([
        fetch("/api/finance?view=ledger"),
        fetch("/api/finance?view=invoices"),
        fetch("/api/finance?view=expenses"),
        fetch("/api/finance?view=tax"),
      ]);
      const txData = await txRes.json();
      const invData = await invRes.json();
      const expData = await expRes.json();
      const taxData = await taxRes.json();

      if (txData.transactions) setTransactions(txData.transactions);
      if (invData.invoices) setInvoices(invData.invoices);
      if (expData.expenses) setExpenses(expData.expenses);
      if (taxData) setTaxSummary(taxData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Executive Financial P&L & GST Ledger
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200">
              OWNER ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Single source of truth tracking court revenue, memberships, shop sales, bar tabs, vendor payables & GST.
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {["LEDGER", "INVOICES", "EXPENSES", "TAX"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {tab === "LEDGER"
                ? `Unified Ledger (${transactions.length})`
                : tab === "INVOICES"
                ? `GST Invoices (${invoices.length})`
                : tab === "EXPENSES"
                ? `Expenses & Payables (${expenses.length})`
                : "GST Tax Report"}
            </button>
          ))}
        </div>
      </div>

      {/* UNIFIED LEDGER VIEW */}
      {activeTab === "LEDGER" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Unified Multi-Module Ledger Journal</h3>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Entry #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Debit / Outflow (₹)</th>
                  <th className="p-3 text-right">Credit / Inflow (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-600">{tx.entryNumber}</td>
                    <td className="p-3 text-slate-500">{formatDateTime(tx.date)}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{tx.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] bg-slate-100 dark:bg-slate-800">
                        {tx.module}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{tx.paymentMethod}</td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {tx.debitPaise > 0 ? formatINR(tx.debitPaise) : "—"}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {tx.creditPaise > 0 ? formatINR(tx.creditPaise) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST INVOICES VIEW */}
      {activeTab === "INVOICES" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">GST Invoices & Tax Breakdowns</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Client / Member</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Subtotal (₹)</th>
                  <th className="p-3">CGST + SGST (18%)</th>
                  <th className="p-3">Total (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-purple-600">{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold">{inv.clientName}</td>
                    <td className="p-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="p-3">{formatINR(inv.subtotalPaise)}</td>
                    <td className="p-3 text-slate-500">
                      {formatINR(inv.cgstPaise)} + {formatINR(inv.sgstPaise)}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{formatINR(inv.totalPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-50 text-emerald-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => window.print()}
                        className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 ml-auto hover:bg-slate-100"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES & VENDOR BILLS */}
      {activeTab === "EXPENSES" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Expenses & Vendor Payables</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Expense #</th>
                  <th className="p-3">Vendor / Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Input GST (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-red-600">{e.expenseNumber}</td>
                    <td className="p-3 font-bold">
                      {e.vendor?.name || "General"} ({e.category})
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{e.description}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">{formatINR(e.amountPaise)}</td>
                    <td className="p-3 text-emerald-600 font-medium">{formatINR(e.taxPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-50 text-emerald-700">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST TAX REPORT */}
      {activeTab === "TAX" && taxSummary && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly GST Summary Report (Input vs Output)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase font-bold">Output GST Collected (Sales)</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {formatINR(taxSummary.taxCollectedPaise)}
              </span>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase font-bold">Input GST Paid (Purchases)</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                {formatINR(taxSummary.taxPaidPaise)}
              </span>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="text-slate-400 block uppercase font-bold">Net GST Payable / (Credit)</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                {formatINR(taxSummary.netGstPayablePaise)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
