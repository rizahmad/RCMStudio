import { badRequest, ok } from '../../../../../lib/http';
import { requireAuth } from '../../../../../lib/authGuard';
import { repo } from '../../../../../lib/repo';
import { writeAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const claim = await repo.getClaim(ctx.tenantId, id);
  if (!claim) return badRequest('Claim not found');
  if (!claim.claim_json?.scrubber?.valid) {
    return badRequest('Scrubber must pass before submission');
  }
  await repo.updateClaim(ctx.tenantId, id, { status: 'SUBMITTED', submittedAt: new Date().toISOString() });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'claim',
    entityId: id,
    action: 'CLAIM_SUBMITTED',
  });
  return ok({ status: 'SUBMITTED' });
}
