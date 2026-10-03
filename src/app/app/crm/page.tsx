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
    { key: "NEW", label: "New Inquiries", border: "border-[#C5A059]", badge: "bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059]" },
    { key: "CONTACTED", label: "Contacted", border: "border-[#0B1320] dark:border-stone-400", badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
    { key: "QUOTE_SENT", label: "Proposal Sent", border: "border-[#921111]", badge: "bg-[#921111]/15 text-[#921111] dark:text-[#e05252]" },
    { key: "TRIAL_BOOKED", label: "Trial Booked", border: "border-emerald-600", badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" },
    { key: "CONVERTED", label: "Enrolled Member", border: "border-emerald-700", badge: "bg-emerald-600 text-white" },
    { key: "LOST", label: "Archived / Lost", border: "border-stone-400", badge: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Prospect Pipeline & Membership Funnel
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#921111]/10 text-[#921111] dark:text-[#e05252] border border-[#921111]/25 font-bold">
              24-HR SLA MONITORING
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Website guest trials, corporate proposals, candidate dossier timeline, and single-click membership enrollment.
          </p>
        </div>

        <button
          onClick={() => {
            const name = prompt("Enter prospect name:");
            const phone = prompt("Enter phone number:");
            if (name && phone) {
              fetch("/api/crm/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, source: "PHONE", sportInterest: "Tennis" }),
              }).then(() => fetchLeads());
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white text-xs font-serif uppercase tracking-wider font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Prospect</span>
        </button>
      </div>

      {/* KANBAN STAGE PIPELINE */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start">
        {stages.map((stg) => {
          const stageLeads = leads.filter((l) => l.status === stg.key);

          return (
            <div
              key={stg.key}
              className="p-3.5 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-3"
            >
              <div className={`flex items-center justify-between pb-2.5 border-b-2 ${stg.border}`}>
                <span className="font-serif font-bold text-xs text-[#0B1320] dark:text-[#FAF8F5] tracking-wide">
                  {stg.label}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stg.badge}`}>
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[320px]">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 dark:text-stone-600 text-[11px] font-mono italic">
                    No candidates
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all shadow-xs hover:shadow-md space-y-2 group ${
                        lead.isStale
                          ? "bg-[#921111]/5 dark:bg-[#921111]/20 border-[#921111]/40"
                          : "bg-[#FAF8F5] dark:bg-[#162232] border-[#E5DFD5] dark:border-[#223042] hover:border-[#C5A059]"
                      }`}
                    >
                      {lead.isStale && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#921111] animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-mono uppercase tracking-wider">SLA Breached (&gt;24h)</span>
                        </div>
                      )}

                      <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5] group-hover:text-[#921111] dark:group-hover:text-[#C5A059] transition-colors">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        {lead.phone}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] font-bold">
                        Interest: {lead.sportInterest || "General Club"}
                      </div>

                      <div className="pt-2 border-t border-[#E5DFD5] dark:border-[#223042] flex items-center justify-between">
                        <span className="text-[9px] text-stone-400 font-mono">{lead.leadNumber}</span>
                        <span className="text-[10px] text-[#921111] dark:text-[#C5A059] font-serif uppercase tracking-wider font-bold group-hover:translate-x-0.5 transition-transform">
                          Dossier →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD DETAILS & ACTIONS MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-[#FAF8F5]">
                  {selectedLead.name}
                </h3>
                <span className="text-[11px] font-mono text-[#C5A059] font-bold tracking-wider">
                  {selectedLead.leadNumber} • {selectedLead.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] flex items-center justify-center text-stone-400 hover:text-[#0B1320] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Stage Action Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block font-mono">
                Advance Pipeline Stage:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleUpdateStatus(selectedLead.id, s.key)}
                    className={`px-3 py-1.5 rounded-lg font-serif text-[11px] uppercase tracking-wider font-bold transition-all ${
                      selectedLead.status === s.key
                        ? "bg-[#921111] text-white shadow-xs"
                        : "bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] text-stone-700 dark:text-stone-300 hover:border-[#C5A059]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Convert to Member */}
            <div className="p-4 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-between">
              <div>
                <span className="font-serif font-bold text-[#0B1320] dark:text-[#FAF8F5] block text-sm">
                  Ready for Club Membership?
                </span>
                <span className="text-[10px] text-stone-600 dark:text-stone-400">
                  Pre-fills new member enrollment dossier with prospect information.
                </span>
              </div>
              <Link
                href="/app/members"
                className="px-3.5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#b08e4c] text-white font-serif uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Member</span>
              </Link>
            </div>

            {/* Generate Quote Button */}
            <button
              onClick={() => {
                setQuoteLead(selectedLead);
                setShowQuoteModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-[#0B1320] hover:bg-[#162232] text-white border border-[#0B1320] font-serif uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Generate Official PDF Proposal</span>
            </button>

            {/* Activity History & Note Adder */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block font-mono">
                Candidate Interaction Log
              </span>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {selectedLead.activities && selectedLead.activities.length > 0 ? (
                  selectedLead.activities.map((act: any) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] text-[11px]"
                    >
                      <span className="font-bold text-[#0B1320] dark:text-[#FAF8F5] block">{act.summary}</span>
                      {act.details && <p className="text-stone-500 dark:text-stone-400 mt-0.5">{act.details}</p>}
                      <span className="text-[9px] font-mono text-[#C5A059] block mt-1">{formatDateTime(act.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-stone-400 text-[11px] italic py-2">No activity logged yet.</div>
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log concierge call, tour feedback, WhatsApp update..."
                  className="flex-1 p-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider text-xs font-bold transition-colors"
                >
                  Log
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE GENERATOR MODAL */}
      {showQuoteModal && quoteLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B1320] dark:text-[#FAF8F5]">
                  Membership Proposal & Quotation
                </h3>
                <span className="text-xs text-stone-500 font-mono">Prepared for {quoteLead.name}</span>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] dark:bg-[#162232] border border-[#E5DFD5] dark:border-[#223042] flex items-center justify-center text-stone-400 hover:text-[#0B1320]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] space-y-2.5">
              <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-300 block">
                Privilege Package Line Items:
              </span>
              {quoteItems.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 border-b border-[#E5DFD5] dark:border-[#223042]">
                  <span className="text-stone-700 dark:text-stone-300">{item.description}</span>
                  <span className="font-mono font-bold text-[#0B1320] dark:text-[#FAF8F5]">{formatINR(item.amountPaise)}</span>
                </div>
              ))}
              <div className="flex justify-between font-serif font-bold text-base pt-2 text-[#921111] dark:text-[#C5A059]">
                <span>Total Annual Proposal:</span>
                <span className="font-mono">
                  {formatINR(quoteItems.reduce((s, it) => s + it.amountPaise, 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-stone-700 dark:text-stone-300 font-serif uppercase tracking-wider text-xs font-semibold hover:border-[#C5A059] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.print();
                  handleUpdateStatus(quoteLead.id, "QUOTE_SENT");
                  setShowQuoteModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print & Dispatch Proposal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
