import { badRequest, ok } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';
import { buildClaimJson } from '../../../../services/claimBuilder';
import { writeAudit } from '../../../../lib/audit';

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const { encounterId } = await request.json();
  if (!encounterId) return badRequest('encounterId required');
  const encounter = await repo.getEncounter(ctx.tenantId, Number(encounterId));
  if (!encounter) return badRequest('Encounter not found');
  const patient = await repo.getPatient(ctx.tenantId, encounter.patient_id);
  if (!patient) return badRequest('Patient missing');
  const insurance = (await repo.listInsurancesForPatient(ctx.tenantId, patient.id))[0];
  const charges = await repo.listChargesForEncounter(ctx.tenantId, encounter.id);
  const tenant = await repo.getTenant(ctx.tenantId);
  const claim_json = buildClaimJson({ patient, insurance, encounter, charges, tenant });
  const claim = await repo.createClaim(ctx.tenantId, { encounter_id: encounter.id, patient_id: patient.id, claim_json });
  await repo.updateEncounter(ctx.tenantId, encounter.id, { status: 'CLAIMED' });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'claim',
    entityId: claim.id,
    action: 'CLAIM_BUILT',
  });
  return ok({ claim });
}
