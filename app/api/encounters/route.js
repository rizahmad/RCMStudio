import { badRequest, ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const encounters = await repo.listEncounters(ctx.tenantId);
  return ok({ encounters });
}

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const data = await request.json();
  if (!data.patient_id) return badRequest('patient_id required');
  const encounter = await repo.createEncounter(ctx.tenantId, data);
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'encounter',
    entityId: encounter.id,
    action: 'ENCOUNTER_CREATED',
  });
  return ok({ encounter });
}
