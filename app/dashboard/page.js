"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_PATH } from "../../lib/clientConfig";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/reports/summary`, { cache: "no-store" });
      if (res.ok) setSummary(await res.json());
      const claimsRes = await fetch(`${BASE_PATH}/api/claims`, { cache: "no-store" });
      if (claimsRes.ok) {
        const data = await claimsRes.json();
        setRecent(data.claims.slice(0, 5));
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of claims performance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {summary ? (
          <>
            <Metric label="Total Claims" value={summary.totalClaims} />
            <Metric label="Draft" value={summary.draftClaims} />
            <Metric label="Submitted" value={summary.submittedClaims} />
            <Metric label="Rejected" value={summary.rejectedClaims} />
            <Metric label="Denied" value={summary.deniedClaims} />
          </>
        ) : (
          <div className="text-sm text-slate-500">Loading metrics…</div>
        )}
      </div>
      <div className="bg-white shadow-sm rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Claims</h2>
            <p className="text-xs text-slate-500">Last 5 created</p>
          </div>
          <Link href="/claims" className="text-xs text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">#{c.id}</td>
                <td className="px-4 py-2">{c.patient?.first_name} {c.patient?.last_name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-2">
                  <Link href={`/claims/${c.id}`} className="text-indigo-600 text-xs hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={4}>
                  No claims yet. Build one from an encounter.
                </td>
              </tr>
            )}
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

function StatusBadge({ status }) {
  const map = {
    DRAFT: "bg-slate-100 text-slate-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    ACCEPTED: "bg-green-100 text-green-700",
    REJECTED: "bg-amber-100 text-amber-700",
    DENIED: "bg-rose-100 text-rose-700",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${map[status] || ""}`}>{status}</span>;
}
