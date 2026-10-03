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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#222D3E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-white tracking-tight">
              Executive Financial P&L & Audited GST Ledger
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/40">
              BOARD ONLY
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            Institutional ledger tracking court fees, membership subscription dues, pro shop retail, clubhouse dining, vendor payables & statutory GST.
          </p>
        </div>

        <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] p-1 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] text-xs font-semibold">
          {["LEDGER", "INVOICES", "EXPENSES", "TAX"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold uppercase tracking-wider ${
                activeTab === tab
                  ? "bg-[#921111] text-white shadow-xs font-bold"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
              }`}
            >
              {tab === "LEDGER"
                ? `Unified Ledger (${transactions.length})`
                : tab === "INVOICES"
                ? `GST Invoices (${invoices.length})`
                : tab === "EXPENSES"
                ? `Payables (${expenses.length})`
                : "Tax Report"}
            </button>
          ))}
        </div>
      </div>

      {/* UNIFIED LEDGER VIEW */}
      {activeTab === "LEDGER" && (
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Unified Multi-Division Ledger Journal</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Chronological record of double-entry cash and tab flows</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-md border border-[#C5A059] text-[#0B1320] dark:text-[#DFCA9B] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#8C6D23]" />
              <span>Export Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
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
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E] font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#0B1320] dark:text-white">{tx.entryNumber}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDateTime(tx.date)}</td>
                    <td className="p-3 font-serif font-bold text-[#0B1320] dark:text-white">{tx.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-[9px] tracking-wider bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white">
                        {tx.module}
                      </span>
                    </td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{tx.paymentMethod}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#921111]">
                      {tx.debitPaise > 0 ? formatINR(tx.debitPaise) : "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#0B1320] dark:text-white">
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
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Audited GST Invoices & Tax Breakdowns</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Tax compliant vouchers with 9% CGST + 9% SGST itemization</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {invoices.length} INVOICES
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
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
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#921111] dark:text-[#DFCA9B]">{inv.invoiceNumber}</td>
                    <td className="p-3 font-serif font-bold text-[#0B1320] dark:text-white">{inv.clientName}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-mono">{formatINR(inv.subtotalPaise)}</td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                      {formatINR(inv.cgstPaise)} + {formatINR(inv.sgstPaise)}
                    </td>
                    <td className="p-3 font-bold font-mono text-[#0B1320] dark:text-white">{formatINR(inv.totalPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => window.print()}
                        className="px-2.5 py-1 rounded-md border border-[#C5A059] text-[#0B1320] dark:text-[#DFCA9B] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Printer className="w-3 h-3 text-[#8C6D23]" />
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
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Institutional Expenses & Vendor Payables</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Operations, floodlighting, maintenance, and retail supplier liabilities</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6D23] dark:text-[#DFCA9B] border border-[#C5A059]/30 font-bold uppercase tracking-wider">
              {expenses.length} PAYABLES
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E5DFD5] dark:border-[#222D3E] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#121A28] text-[#8C6D23] dark:text-[#DFCA9B] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#222D3E]">
                <tr>
                  <th className="p-3">Expense #</th>
                  <th className="p-3">Vendor / Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Input GST (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#222D3E]">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#121A28]/50">
                    <td className="p-3 font-mono font-bold text-[#921111]">{e.expenseNumber}</td>
                    <td className="p-3 font-serif font-bold text-[#0B1320] dark:text-white">
                      {e.vendor?.name || "General"} ({e.category})
                    </td>
                    <td className="p-3 text-[#6B7280] dark:text-[#9CA3AF]">{e.description}</td>
                    <td className="p-3 font-bold font-mono text-[#0B1320] dark:text-white">{formatINR(e.amountPaise)}</td>
                    <td className="p-3 font-mono text-[#8C6D23] dark:text-[#DFCA9B]">{formatINR(e.taxPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] tracking-wider bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-[#0B1320] dark:text-white">
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
        <div className="p-6 rounded-lg bg-white dark:bg-[#0E1522] border border-[#E5DFD5] dark:border-[#222D3E] shadow-sm space-y-6">
          <div className="pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-white">Monthly Statutory GST Summary (Input vs Output)</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Reconciliation of tax collected on sales vs tax paid on procurement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Output GST Collected (Sales)</span>
              <span className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-1 block">
                {formatINR(taxSummary.taxCollectedPaise)}
              </span>
            </div>
            <div className="p-5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Input GST Paid (Purchases)</span>
              <span className="text-2xl font-serif font-bold text-[#0B1320] dark:text-white mt-1 block">
                {formatINR(taxSummary.taxPaidPaise)}
              </span>
            </div>
            <div className="p-5 rounded-md bg-[#FAF8F5] dark:bg-[#121A28] border border-[#C5A059]/40 text-xs">
              <span className="text-[#8C6D23] dark:text-[#DFCA9B] uppercase font-bold tracking-wider block">Net GST Payable / (Credit)</span>
              <span className="text-2xl font-serif font-bold text-[#921111] dark:text-[#DFCA9B] mt-1 block">
                {formatINR(taxSummary.netGstPayablePaise)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
