import { Suspense } from "react";
import EncounterForm from "./EncounterForm";

export default function NewEncounterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading encounter form…</div>}>
      <EncounterForm />
    </Suspense>
  );
}
