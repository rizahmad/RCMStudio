"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_PATH } from "../../lib/clientConfig";

const tabs = [
  { key: "draft", label: "Draft" },
  { key: "scrubberErrors", label: "Scrubber Errors" },
  { key: "submitted", label: "Submitted" },
  { key: "rejected", label: "Rejected" },
  { key: "denied", label: "Denied" },
];

export default function Worklists() {
  const [active, setActive] = useState("draft");
  const [lists, setLists] = useState({});

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/worklists`, { cache: "no-store" });
      if (res.ok) setLists(await res.json());
    }
    load();
  }, []);

  const rows = lists[active] || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Worklists</h1>
        <p className="text-sm text-slate-500">Move claims through to payment</p>
      </div>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`btn-pill ${active === t.key ? "btn-pill-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Claim</th>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
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
            {!rows.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500 text-sm" colSpan={4}>
                  Nothing in this bucket yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
