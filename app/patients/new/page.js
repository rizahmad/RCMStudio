"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_PATH } from "../../../lib/clientConfig";
import { useAuth } from "../../../components/AuthProvider";

export default function NewPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState({ first_name: "", last_name: "", dob: "", gender: "" });
  const [insurance, setInsurance] = useState({ payer_name: "", member_id: "", subscriber_name: "", subscriber_dob: "", card_url: "" });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const { can } = useAuth();
  const canCreate = can("create_patient");

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) {
      setError("You do not have permission to create patients.");
      return;
    }
    setError("");
    const res = await fetch(`${BASE_PATH}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient, insurance }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Unable to save patient");
      return;
    }
    router.push("/patients");
  }

  async function uploadCard(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_PATH}/api/upload/insurance-card`, { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      setInsurance((prev) => ({ ...prev, card_url: data.url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Patient</h1>
        <p className="text-sm text-slate-500">Patient and insurance basics</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <Section title="Patient Info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name">
              <input className="input" value={patient.first_name} onChange={(e) => setPatient({ ...patient, first_name: e.target.value })} />
            </Field>
            <Field label="Last Name">
              <input className="input" value={patient.last_name} onChange={(e) => setPatient({ ...patient, last_name: e.target.value })} />
            </Field>
            <Field label="DOB">
              <input type="date" className="input" value={patient.dob} onChange={(e) => setPatient({ ...patient, dob: e.target.value })} />
            </Field>
            <Field label="Gender">
              <select className="input" value={patient.gender} onChange={(e) => setPatient({ ...patient, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Insurance">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payer Name">
              <input className="input" value={insurance.payer_name} onChange={(e) => setInsurance({ ...insurance, payer_name: e.target.value })} />
            </Field>
            <Field label="Member ID">
              <input className="input" value={insurance.member_id} onChange={(e) => setInsurance({ ...insurance, member_id: e.target.value })} />
            </Field>
            <Field label="Subscriber Name">
              <input className="input" value={insurance.subscriber_name} onChange={(e) => setInsurance({ ...insurance, subscriber_name: e.target.value })} />
            </Field>
            <Field label="Subscriber DOB">
              <input type="date" className="input" value={insurance.subscriber_dob} onChange={(e) => setInsurance({ ...insurance, subscriber_dob: e.target.value })} />
            </Field>
            <Field label="Insurance Card (URL)">
              <input className="input" placeholder="https://..." value={insurance.card_url} onChange={(e) => setInsurance({ ...insurance, card_url: e.target.value })} />
            </Field>
            <Field label="Upload Insurance Card">
              <input
                type="file"
                className="input"
                accept="image/*,application/pdf"
                onChange={uploadCard}
                disabled={!canCreate}
              />
              {uploading && <span className="text-xs text-slate-500">Uploading…</span>}
            </Field>
          </div>
        </Section>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={!canCreate}>
            Save Patient
          </button>
          <button type="button" onClick={() => router.push("/patients")} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm text-slate-700 flex flex-col gap-1">
      {label}
      {children}
    </label>
  );
}
