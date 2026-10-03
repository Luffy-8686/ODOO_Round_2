"use client";

import React, { useState, useEffect } from "react";
import { formatDateTime, formatINR } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  Target,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  FileText,
  UserPlus,
  MessageSquare,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";

export default function CrmPipelinePage() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  // Quote Generator Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteLead, setQuoteLead] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState([
    { description: "Corporate Gold Annual Membership (5 Pax)", amountPaise: 25000000 },
    { description: "Weekend Padel Court Exclusive Block (4 Hours)", amountPaise: 400000 },
    { description: "Clubhouse Refreshments & Protein Catering", amountPaise: 350000 },
  ]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/leads");
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          status: nextStatus,
          staffUserId: currentUser?.id,
          staffUserName: currentUser?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !selectedLead) return;

    try {
      await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLead.id,
          note: newNote,
          staffUserId: currentUser?.id,
          staffUserName: currentUser?.name,
        }),
      });
      setNewNote("");
      fetchLeads();
      // Reload selected lead
      const updated = leads.find((l) => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const stages = [
    { key: "NEW", label: "New Leads", color: "border-blue-500" },
    { key: "CONTACTED", label: "Contacted", color: "border-amber-500" },
    { key: "QUOTE_SENT", label: "Quote Sent", color: "border-purple-500" },
    { key: "TRIAL_BOOKED", label: "Trial Booked", color: "border-emerald-500" },
    { key: "CONVERTED", label: "Converted", color: "border-green-600" },
    { key: "LOST", label: "Archived / Lost", color: "border-slate-400" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enquiry Funnel & CRM Pipeline
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              24-HR SLA MONITORING
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Website trials, corporate quotes, lead timeline, quote generator, and 1-click member conversion.
          </p>
        </div>

        <button
          onClick={() => {
            const name = prompt("Enter lead name:");
            const phone = prompt("Enter phone number:");
            if (name && phone) {
              fetch("/api/crm/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, source: "PHONE", sportInterest: "Tennis" }),
              }).then(() => fetchLeads());
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Quick Lead</span>
        </button>
      </div>

      {/* KANBAN STAGE PIPELINE */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-start">
        {stages.map((stg) => {
          const stageLeads = leads.filter((l) => l.status === stg.key);

          return (
            <div
              key={stg.key}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className={`flex items-center justify-between pb-2 border-b-2 ${stg.color}`}>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{stg.label}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all shadow-xs hover:shadow-md space-y-2 ${
                      lead.isStale
                        ? "bg-red-50/70 dark:bg-red-950/40 border-red-300 dark:border-red-800"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80"
                    }`}
                  >
                    {lead.isStale && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>SLA Breached (&gt;24h)</span>
                      </div>
                    )}

                    <div className="font-bold text-slate-900 dark:text-white">{lead.name}</div>
                    <div className="text-[11px] text-slate-500">{lead.phone}</div>
                    <div className="text-[10px] font-mono text-emerald-600 font-semibold">
                      Interest: {lead.sportInterest || "Club"}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-mono">{lead.leadNumber}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Details →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD DETAILS & ACTIONS MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedLead.name}</h3>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                  {selectedLead.leadNumber} • {selectedLead.status}
                </span>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1 rounded text-slate-400">
                ✕
              </button>
            </div>

            {/* Stage Action Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Move Pipeline Stage:</span>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleUpdateStatus(selectedLead.id, s.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      selectedLead.status === s.key
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Convert to Member */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 block">Ready to Sign Up?</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">
                  Pre-fills member onboarding with prospect details
                </span>
              </div>
              <Link
                href="/app/members"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convert to Member</span>
              </Link>
            </div>

            {/* Generate Quote Button */}
            <button
              onClick={() => {
                setQuoteLead(selectedLead);
                setShowQuoteModal(true);
              }}
              className="w-full py-2 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate PDF Proposal / Quotation</span>
            </button>

            {/* Activity History & Note Adder */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Activity Log</span>
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {selectedLead.activities?.map((act: any) => (
                  <div key={act.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
                    <span className="font-bold block">{act.summary}</span>
                    {act.details && <p className="text-slate-500">{act.details}</p>}
                    <span className="text-[9px] text-slate-400 block mt-0.5">{formatDateTime(act.createdAt)}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log call note, WhatsApp update..."
                  className="flex-1 p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <button type="submit" className="px-3 py-2 rounded-lg bg-slate-800 text-white font-bold text-xs">
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE GENERATOR MODAL */}
      {showQuoteModal && quoteLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quotation Proposal for {quoteLead.name}
            </h3>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Line Items:</span>
              {quoteItems.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span>{item.description}</span>
                  <span className="font-mono font-bold">{formatINR(item.amountPaise)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-sm pt-2 text-emerald-600">
                <span>Total Package Price:</span>
                <span>
                  {formatINR(quoteItems.reduce((s, it) => s + it.amountPaise, 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  handleUpdateStatus(quoteLead.id, "QUOTE_SENT");
                  setShowQuoteModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print & Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
