import { badRequest, ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const body = await request.json();
  if (!body.claimId || !body.reason) return badRequest('claimId and reason required');
  const claim = await repo.getClaim(ctx.tenantId, Number(body.claimId));
  if (!claim) return badRequest('Claim not found');
  const denial = await repo.addDenial(ctx.tenantId, {
    claim_id: claim.id,
    reason: body.reason,
    status: body.status || 'OPEN',
  });
  await repo.updateClaim(ctx.tenantId, claim.id, { status: 'DENIED' });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'denial',
    entityId: denial.id,
    action: 'DENIAL_CREATED',
    metadata: { status: denial.status },
  });
  return ok({ denial });
}
