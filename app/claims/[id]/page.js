"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BASE_PATH } from "../../../lib/clientConfig";
import { useAuth } from "../../../components/AuthProvider";

export default function ClaimDetail() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const { can } = useAuth();
  const canSubmit = can("submit_claim");
  const canScrub = can("run_scrubber");
  const canAiReview = can("ai_review");
  const canApplyAi = can("apply_ai");
  const canAddDenial = can("add_denial");

  async function load() {
    const res = await fetch(`${BASE_PATH}/api/claims/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!data) return <div>Loading claim...</div>;
  const { claim, patient, encounter, charges, denials } = data;

  async function runScrubber() {
    if (!canScrub) {
      setMessage("You do not have permission to run the scrubber.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/claims/${claim.id}/scrub`, { method: "POST" });
    if (res.ok) {
      const { scrubber } = await res.json();
      setData({ ...data, claim: { ...claim, claim_json: { ...claim.claim_json, scrubber } } });
    }
  }

  async function runAi() {
    if (!canAiReview) {
      setMessage("You do not have permission to run AI review.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/claims/${claim.id}/ai-review`, { method: "POST" });
    if (res.ok) {
      const { aiReview } = await res.json();
      setData({ ...data, claim: { ...claim, claim_json: { ...claim.claim_json, aiReview } } });
    }
  }

  async function applySuggestions() {
    if (!canApplyAi) {
      setMessage("You do not have permission to apply AI suggestions.");
      return;
    }
    const updates = { ...claim.claim_json, aiReview: { ...claim.claim_json?.aiReview, applied: true } };
    await fetch(`${BASE_PATH}/api/claims/${claim.id}/apply-suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setMessage("Applied AI suggestions (flagged).");
    load();
  }

  async function submitClaim() {
    if (!canSubmit) {
      setMessage("You do not have permission to submit claims.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/claims/${claim.id}/submit`, { method: "POST" });
    const body = await res.json();
    if (res.ok) {
      setMessage("Claim submitted");
      load();
    } else {
      setMessage(body.error || "Submit failed");
    }
  }

  async function createDenial() {
    if (!canAddDenial) {
      setMessage("You do not have permission to add denials.");
      return;
    }
    if (!denialReason) return;
    await fetch(`${BASE_PATH}/api/denials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId: claim.id, reason: denialReason }),
    });
    setDenialReason("");
    load();
  }

  const scrubber = claim.claim_json?.scrubber;
  const aiReview = claim.claim_json?.aiReview;
  const canSubmitNow = scrubber?.valid && canSubmit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Claim #{claim.id}</h1>
          <p className="text-sm text-slate-500">
            Patient: {patient?.first_name} {patient?.last_name} · Encounter #{encounter?.id}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={submitClaim}
            disabled={!canSubmitNow}
            className="btn btn-primary"
          >
            Submit Claim
          </button>
        </div>
      </div>
      {message && <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2">{message}</div>}

      <div className="grid grid-cols-3 gap-4">
        <Panel title="Service Lines" className="col-span-2">
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
            </tbody>
          </table>
        </Panel>

        <Panel title="Scrubber">
          <button onClick={runScrubber} className="btn btn-secondary" disabled={!canScrub}>
            Run Scrubber
          </button>
          <div className="mt-2 text-sm">
            {scrubber ? (
              scrubber.valid ? (
                <div className="text-green-700 bg-green-50 border border-green-200 rounded-md p-2">No errors</div>
              ) : (
                <ul className="space-y-1">
                  {scrubber.errors.map((err, idx) => (
                    <li key={idx} className="text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      {err.field}: {err.message}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="text-slate-500">Not run yet</div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="AI Copilot">
          <div className="flex gap-2">
            <button onClick={runAi} className="btn btn-secondary" disabled={!canAiReview}>
              Review Claim
            </button>
            <button onClick={applySuggestions} className="btn btn-outline" disabled={!canApplyAi}>
              Apply Suggestions
            </button>
          </div>
          <div className="mt-2 text-sm space-y-2">
            {aiReview ? (
              <>
                <div className="font-medium">Summary</div>
                <p className="text-slate-600">{aiReview.summary}</p>
                <div className="font-medium">Risks</div>
                <ul className="list-disc list-inside text-slate-600">
                  {aiReview.risks?.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
                <div className="font-medium">Suggested Changes</div>
                <ul className="list-disc list-inside text-slate-600">
                  {aiReview.suggestedChanges?.map((s, idx) => (
                    <li key={idx}>{s.field}: {s.message}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-slate-500">No AI review yet</div>
            )}
          </div>
        </Panel>

        <Panel title="Denials">
          <div className="space-y-2">
            {denials?.length ? (
              denials.map((d) => (
                <div key={d.id} className="border border-slate-100 rounded-md p-2 text-sm">
                  <div className="font-medium">Status: {d.status}</div>
                  <div className="text-slate-600">{d.reason}</div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No denials</div>
            )}
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Add denial reason"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
              />
              <button onClick={createDenial} className="btn btn-danger" disabled={!canAddDenial}>
                Add Denial
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-2 ${className}`}>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}
