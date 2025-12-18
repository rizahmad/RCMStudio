"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_PATH } from "../../lib/clientConfig";

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/claims`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Claims</h1>
        <p className="text-sm text-slate-500">Track claim lifecycle</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
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
            {claims.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">#{c.id}</td>
                <td className="px-4 py-2">{c.patient?.first_name} {c.patient?.last_name}</td>
                <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-2">
                  <Link href={`/claims/${c.id}`} className="text-indigo-600 text-xs hover:underline">Open</Link>
                </td>
              </tr>
            ))}
            {!claims.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500 text-sm" colSpan={4}>
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
