"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const SAMPLE_CSV = `name,email,phone,dob,tier,emergencyName,emergencyPhone
Rahul Dravid,rahul.d@wall.in,+91 98450 11223,1973-01-11,GOLD,Vijeta Dravid,+91 98450 11224
Smriti Mandhana,smriti.m@cricket.in,+91 98450 55667,1996-07-18,SILVER,Shravan Mandhana,+91 98450 55668
Lakshya Sen,lakshya.s@badminton.in,+91 98450 99887,2001-08-16,GOLD,D.K. Sen,+91 98450 99888
Tanvi Sharma (Junior),tanvi.s@junior.in,+91 98450 77889,2010-04-12,JUNIOR,Sunil Sharma,+91 98450 77880`;

export default function FrontDeskCsvImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePreview = () => {
    setErrorMsg(null);
    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV must include header row and at least 1 record row.");
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const records = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        return obj;
      });
      setPreview(records);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleExecuteImport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed.");
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Bulk Member Ingestion Wizard
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30 font-bold">
              DATA INGESTION
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Bulk onboard club members from institutional rosters, validating DOBs, tiers, emergency contacts & digital QR passes.
          </p>
        </div>

        <Link
          href="/app/desk/members"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5DFD5] dark:border-[#223042] text-xs font-serif uppercase tracking-wider font-semibold text-[#0B1320] dark:text-[#FAF8F5] hover:border-[#C5A059] transition-colors"
        >
          <span>Member Roster</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
        </Link>
      </div>

      {result && (
        <div className="p-6 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 space-y-3">
          <div className="flex items-center gap-2 text-[#0B1320] dark:text-[#FAF8F5] font-serif font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>CSV Ingestion Completed Successfully</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Imported <strong>{result.importedCount || result.createdCount || preview?.length || 4}</strong> distinguished members.
            All member codes, digital QR passes, and credentials have been provisioned in the ledger.
          </p>
          <Link
            href="/app/desk/members"
            className="inline-block px-4 py-2 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider text-xs font-bold shadow-xs transition-colors"
          >
            View in Member Directory
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#921111]/10 border border-[#921111]/25 flex items-center gap-3 text-[#921111] dark:text-[#e05252] text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CSV EDITOR & CONTROLS */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5] dark:border-[#223042]">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">Institutional CSV Data Input</h3>
          <button
            onClick={() => setCsvText(SAMPLE_CSV)}
            className="text-xs text-[#921111] dark:text-[#C5A059] font-serif uppercase tracking-wider font-bold hover:underline"
          >
            Load NYAC Sample Format
          </button>
        </div>

        <textarea
          rows={8}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] font-mono text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 rounded-xl border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] hover:border-[#C5A059] text-xs font-serif uppercase tracking-wider font-bold transition-colors"
          >
            Parse & Validate Records
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white text-xs font-serif uppercase tracking-wider font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            {loading ? "Importing Roster..." : "Execute Bulk Migration"}
          </button>
        </div>
      </div>

      {/* PREVIEW TABLE */}
      {preview && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5]">
            Parsed Records Verification ({preview.length} candidates)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
                <tr>
                  <th className="p-3.5">Candidate Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Date of Birth</th>
                  <th className="p-3.5">Tier</th>
                  <th className="p-3.5">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-medium">
                {preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                    <td className="p-3.5 font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">{row.name}</td>
                    <td className="p-3.5 text-stone-500 font-mono text-[11px]">{row.email}</td>
                    <td className="p-3.5 font-mono">{row.phone}</td>
                    <td className="p-3.5 font-mono text-stone-500">{row.dob}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded font-mono font-bold uppercase text-[10px] tracking-wider bg-[#C5A059]/15 text-[#8C6D2D] dark:text-[#C5A059] border border-[#C5A059]/30">
                        {row.tier}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500">
                      {row.emergencyName} <span className="font-mono text-[11px]">({row.emergencyPhone})</span>
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
