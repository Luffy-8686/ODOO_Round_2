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
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Bulk Member CSV Migration Wizard
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
              📥 DATA INGESTION
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bulk onboard club members from legacy spreadsheets, validating DOBs, tiers, emergency contacts & QR generation.
          </p>
        </div>

        <Link
          href="/app/desk/members"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>Return to Member Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {result && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>CSV Ingestion Completed Successfully!</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Imported <strong>{result.importedCount || result.createdCount || preview?.length || 4}</strong> new club members.
            All member codes, digital QR passes, and login credentials have been provisioned.
          </p>
          <Link
            href="/app/desk/members"
            className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            View in Member Directory
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CSV EDITOR & CONTROLS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">CSV Data Input</h3>
          <button
            onClick={() => setCsvText(SAMPLE_CSV)}
            className="text-xs text-purple-600 font-semibold hover:underline"
          >
            Load Sample Format
          </button>
        </div>

        <textarea
          rows={8}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
          >
            Parse & Preview
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            {loading ? "Importing Records..." : "Execute Bulk Migration"}
          </button>
        </div>
      </div>

      {/* PREVIEW TABLE */}
      {preview && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Parsed Records Preview ({preview.length} rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">DOB</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold">{row.name}</td>
                    <td className="p-3 text-slate-500">{row.email}</td>
                    <td className="p-3">{row.phone}</td>
                    <td className="p-3 font-mono">{row.dob}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] bg-amber-100 text-amber-800">
                        {row.tier}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {row.emergencyName} ({row.emergencyPhone})
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
