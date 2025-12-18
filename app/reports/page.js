"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "../../lib/clientConfig";
import Link from "next/link";

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/reports/summary`, { cache: "no-store" });
      if (res.ok) setSummary(await res.json());
      const claimsRes = await fetch(`${BASE_PATH}/api/claims`, { cache: "no-store" });
      if (claimsRes.ok) {
        const data = await claimsRes.json();
        setClaims(data.claims);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Snapshot metrics and export-ready tables</p>
      </div>
      {summary ? (
        <div className="grid grid-cols-4 gap-3">
          <Metric label="Total" value={summary.totalClaims} />
          <Metric label="Submitted" value={summary.submittedClaims} />
          <Metric label="Rejected" value={summary.rejectedClaims} />
          <Metric label="Denied" value={summary.deniedClaims} />
          <Metric label="1st Pass Acceptance" value={`${Math.round((summary.firstPassAcceptance || 0) * 100)}%`} />
        </div>
      ) : (
        <div className="text-sm text-slate-500">Loading summary…</div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900 flex items-center justify-between">
          <span>Claims</span>
          <a href={`${BASE_PATH}/api/reports/claims`} className="text-xs text-indigo-600 hover:underline">
            Export CSV
          </a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">#{c.id}</td>
                <td className="px-4 py-2">{c.patient?.first_name} {c.patient?.last_name}</td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">
                  <Link href={`/claims/${c.id}`} className="text-indigo-600 text-xs hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
