"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BASE_PATH } from "../../../lib/clientConfig";
import { useAuth } from "../../../components/AuthProvider";

export default function EncounterDetail() {
  const params = useParams();
  const router = useRouter();
  const [encounter, setEncounter] = useState(null);
  const [charges, setCharges] = useState([]);
  const [claim, setClaim] = useState(null);
  const [chargeForm, setChargeForm] = useState({ cpt: "", icd10: "", modifier: "", units: 1, charge_amount: 0 });
  const [message, setMessage] = useState("");
  const { can } = useAuth();
  const canBuild = can("build_claim");
  const canAddCharge = can("add_charge");

  async function load() {
    const res = await fetch(`${BASE_PATH}/api/encounters/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setEncounter(data.encounter);
      setCharges(data.charges || []);
      setClaim(data.claim || null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function addCharge() {
    if (!canAddCharge) {
      setMessage("You do not have permission to add charges.");
      return;
    }
    setMessage("");
    const payload = { ...chargeForm, encounter_id: Number(params.id), units: Number(chargeForm.units), charge_amount: Number(chargeForm.charge_amount) };
    const res = await fetch(`${BASE_PATH}/api/charges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setChargeForm({ cpt: "", icd10: "", modifier: "", units: 1, charge_amount: 0 });
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to add charge");
    }
  }

  async function buildClaim() {
    if (!canBuild) {
      setMessage("You do not have permission to build claims.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/claims/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encounterId: Number(params.id) }),
    });
    if (res.ok) {
      const data = await res.json();
      setClaim(data.claim);
      setMessage("Claim built");
      router.push(`/claims/${data.claim.id}`);
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to build claim");
    }
  }

  if (!encounter) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Encounter #{encounter.id}</h1>
          <p className="text-sm text-slate-500">DOS: {encounter.date_of_service} · Provider: {encounter.provider_npi}</p>
        </div>
        {claim ? (
          <Link href={`/claims/${claim.id}`} className="btn btn-primary">
            View Claim
          </Link>
        ) : (
          <button onClick={buildClaim} className="btn btn-primary" disabled={!canBuild}>
            Build Claim
          </button>
        )}
      </div>
      {message && <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2">{message}</div>}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-900">Charges</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-2 py-1">CPT</th>
              <th className="px-2 py-1">ICD-10</th>
              <th className="px-2 py-1">Modifier</th>
              <th className="px-2 py-1">Units</th>
              <th className="px-2 py-1">Charge</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-2 py-1">{c.cpt}</td>
                <td className="px-2 py-1">{c.icd10}</td>
                <td className="px-2 py-1">{c.modifier}</td>
                <td className="px-2 py-1">{c.units}</td>
                <td className="px-2 py-1">${c.charge_amount}</td>
              </tr>
            ))}
            {!charges.length && (
              <tr>
                <td className="px-2 py-2 text-slate-500" colSpan={5}>
                  No charges yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="grid grid-cols-5 gap-2 pt-2">
          <input className="input" placeholder="CPT" value={chargeForm.cpt} onChange={(e) => setChargeForm({ ...chargeForm, cpt: e.target.value })} />
          <input className="input" placeholder="ICD-10" value={chargeForm.icd10} onChange={(e) => setChargeForm({ ...chargeForm, icd10: e.target.value })} />
          <input className="input" placeholder="Modifier" value={chargeForm.modifier} onChange={(e) => setChargeForm({ ...chargeForm, modifier: e.target.value })} />
          <input className="input" type="number" placeholder="Units" value={chargeForm.units} onChange={(e) => setChargeForm({ ...chargeForm, units: e.target.value })} />
          <input className="input" type="number" placeholder="Charge" value={chargeForm.charge_amount} onChange={(e) => setChargeForm({ ...chargeForm, charge_amount: e.target.value })} />
        </div>
        <button onClick={addCharge} className="btn btn-secondary w-fit" disabled={!canAddCharge}>
          Add Charge
        </button>
      </div>
      <Link href="/encounters/new" className="text-sm text-indigo-600 hover:underline">
        New encounter
      </Link>
    </div>
  );
}
