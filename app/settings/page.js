"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "../../lib/clientConfig";
import { useAuth } from "../../components/AuthProvider";

export default function Settings() {
  const [settings, setSettings] = useState({ practiceName: "", npi: "", taxId: "", address: "" });
  const [message, setMessage] = useState("");
  const { can } = useAuth();
  const canSave = can("settings_write");

  useEffect(() => {
    async function load() {
      const res = await fetch(`${BASE_PATH}/api/settings`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          practiceName: data.practiceName || "",
          npi: data.npi || "",
          taxId: data.taxId || "",
          address: data.address || "",
        });
      }
    }
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!canSave) {
      setMessage("You do not have permission to update settings.");
      return;
    }
    setMessage("");
    const res = await fetch(`${BASE_PATH}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setMessage("Settings saved");
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to save settings");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Practice defaults for claim building</p>
      </div>
      {message && <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2">{message}</div>}
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <Field label="Practice Name" value={settings.practiceName} disabled={!canSave} onChange={(v) => setSettings({ ...settings, practiceName: v })} />
        <Field label="NPI" value={settings.npi} disabled={!canSave} onChange={(v) => setSettings({ ...settings, npi: v })} />
        <Field label="Tax ID" value={settings.taxId} disabled={!canSave} onChange={(v) => setSettings({ ...settings, taxId: v })} />
        <Field label="Address" value={settings.address} disabled={!canSave} onChange={(v) => setSettings({ ...settings, address: v })} />
        <button type="submit" className="btn btn-primary" disabled={!canSave}>
          Save
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, disabled }) {
  return (
    <label className="text-sm text-slate-700 flex flex-col gap-1">
      {label}
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </label>
  );
}
