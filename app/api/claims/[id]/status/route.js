import { badRequest, ok } from '../../../../../lib/http';
import { requireAuth } from '../../../../../lib/authGuard';
import { repo } from '../../../../../lib/repo';
import { writeAudit } from '../../../../../lib/audit';

const ALLOWED = ['ACCEPTED', 'REJECTED'];

export async function POST(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const { status } = await request.json();
  if (!ALLOWED.includes(status)) return badRequest('Status not allowed');
  const claim = await repo.getClaim(ctx.tenantId, id);
  if (!claim) return badRequest('Claim not found');
  if (claim.status !== 'SUBMITTED') return badRequest('Can only update submitted claims');
  await repo.updateClaim(ctx.tenantId, id, { status });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'claim',
    entityId: id,
    action: 'CLAIM_STATUS_UPDATED',
    metadata: { status },
  });
  return ok({ status });
}
