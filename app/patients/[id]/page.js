"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BASE_PATH } from "../../../lib/clientConfig";
import { useAuth } from "../../../components/AuthProvider";

export default function PatientDetail() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [insurances, setInsurances] = useState([]);
  const [error, setError] = useState("");
  const { can } = useAuth();
  const canCreateEncounter = can("create_encounter");

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/patients/${params.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
        setInsurances(data.insurances || []);
      } else {
        setError("Unable to load patient");
      }
    }
    load();
  }, [params.id]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!patient) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-slate-500">DOB: {patient.dob} · Gender: {patient.gender}</p>
        </div>
        <button
          onClick={() => router.push(`/encounters/new?patientId=${patient.id}`)}
          className="btn btn-primary"
          disabled={!canCreateEncounter}
          title={!canCreateEncounter ? "Requires Admin or Biller role" : undefined}
        >
          Create Encounter
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-900 mb-3">Insurance</div>
        <ul className="space-y-2 text-sm">
          {insurances.map((i) => (
            <li key={i.id} className="border border-slate-100 rounded-md p-2">
              <div className="font-medium">{i.payer_name}</div>
              <div className="text-slate-500">Member ID: {i.member_id}</div>
              {i.card_url && (
                <a href={i.card_url} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs hover:underline">
                  View insurance card
                </a>
              )}
            </li>
          ))}
          {!insurances.length && <li className="text-slate-500">No insurance on file.</li>}
        </ul>
      </div>
      <Link href="/patients" className="text-sm text-indigo-600 hover:underline">
        Back to patients
      </Link>
    </div>
  );
}
