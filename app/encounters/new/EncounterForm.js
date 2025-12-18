"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BASE_PATH } from "../../../lib/clientConfig";
import { useAuth } from "../../../components/AuthProvider";

export default function EncounterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [encounter, setEncounter] = useState({
    patient_id: searchParams.get("patientId") || "",
    date_of_service: "",
    provider_npi: "",
    place_of_service: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const { can } = useAuth();
  const canCreate = can("create_encounter");

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

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) {
      setError("You do not have permission to create encounters.");
      return;
    }
    setError("");
    const res = await fetch(`${BASE_PATH}/api/encounters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encounter),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Unable to create encounter");
      return;
    }
    const { encounter: saved } = await res.json();
    router.push(`/encounters/${saved.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Encounter</h1>
        <p className="text-sm text-slate-500">Capture visit details before adding charges</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-700 flex flex-col gap-1">
            Patient
            <select
              className="input"
              value={encounter.patient_id}
              onChange={(e) => setEncounter({ ...encounter, patient_id: Number(e.target.value) })}
            >
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700 flex flex-col gap-1">
            Date of Service
            <input
              className="input"
              type="date"
              value={encounter.date_of_service}
              onChange={(e) => setEncounter({ ...encounter, date_of_service: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700 flex flex-col gap-1">
            Provider NPI
            <input
              className="input"
              value={encounter.provider_npi}
              onChange={(e) => setEncounter({ ...encounter, provider_npi: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700 flex flex-col gap-1">
            Place of Service
            <input
              className="input"
              value={encounter.place_of_service}
              onChange={(e) => setEncounter({ ...encounter, place_of_service: e.target.value })}
            />
          </label>
        </div>
        <label className="text-sm text-slate-700 flex flex-col gap-1">
          Notes
          <textarea
            className="input"
            value={encounter.notes}
            onChange={(e) => setEncounter({ ...encounter, notes: e.target.value })}
          />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={!canCreate}>
            Save Encounter
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
