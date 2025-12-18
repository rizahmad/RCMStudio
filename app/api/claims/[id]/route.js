import { badRequest, ok } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';

export async function GET(request, { params }) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const claim = await repo.getClaim(ctx.tenantId, id);
  if (!claim) return badRequest('Claim not found');
  const patient = await repo.getPatient(ctx.tenantId, claim.patient_id);
  const encounter = await repo.getEncounter(ctx.tenantId, claim.encounter_id);
  const charges = encounter ? await repo.listChargesForEncounter(ctx.tenantId, encounter.id) : [];
  const denials = await repo.listDenialsForClaim(ctx.tenantId, claim.id);
  return ok({ claim, patient, encounter, charges, denials });
}
