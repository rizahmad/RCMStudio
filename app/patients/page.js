"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASE_PATH } from "../../lib/clientConfig";
import { useAuth } from "../../components/AuthProvider";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const { can } = useAuth();
  const canCreate = can("create_patient");

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/patients`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">Manage patient and insurance details</p>
        </div>
        {canCreate ? (
          <Link href="/patients/new" className="btn btn-primary">
            New Patient
          </Link>
        ) : (
          <button className="btn btn-secondary" disabled title="Requires Admin or Biller role">
            New Patient
          </button>
        )}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">DOB</th>
              <th className="px-4 py-2">Gender</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.first_name} {p.last_name}</td>
                <td className="px-4 py-2">{p.dob}</td>
                <td className="px-4 py-2">{p.gender}</td>
                <td className="px-4 py-2">
                  <Link href={`/patients/${p.id}`} className="text-indigo-600 text-xs hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {!patients.length && (
              <tr>
                <td className="px-4 py-4 text-slate-500 text-sm" colSpan={4}>
                  No patients yet. Add one to start billing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
