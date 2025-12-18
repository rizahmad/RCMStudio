import { badRequest, ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER', 'CODER']);
  if (error) return error;
  const data = await request.json();
  if (!data.encounter_id) return badRequest('encounter_id required');
  if (!(await repo.getEncounter(ctx.tenantId, data.encounter_id))) return badRequest('Encounter not found');
  const charge = await repo.addCharge(ctx.tenantId, data);
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'charge',
    entityId: charge.id,
    action: 'CHARGE_CREATED',
  });
  return ok({ charge });
}
