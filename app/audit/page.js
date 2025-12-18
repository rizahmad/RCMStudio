"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "../../lib/clientConfig";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/audit`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">Recent changes across claims, encounters, and settings</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{l.createdAt || l.created_at || ""}</td>
                <td className="px-4 py-2">{l.user_id || "N/A"}</td>
                <td className="px-4 py-2 uppercase font-semibold">{l.entity}</td>
                <td className="px-4 py-2">{l.action}</td>
                <td className="px-4 py-2 text-xs text-slate-600 break-all">{JSON.stringify(l.metadata || {})}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No audit entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
