import { badRequest, ok } from '../../../../../lib/http';
import { requireAuth } from '../../../../../lib/authGuard';
import { repo } from '../../../../../lib/repo';
import { writeAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER', 'CODER']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const claim = await repo.getClaim(ctx.tenantId, id);
  if (!claim) return badRequest('Claim not found');
  const body = await request.json();
  const updates = body?.updates || {};
  const claim_json = { ...claim.claim_json, ...updates };
  await repo.updateClaim(ctx.tenantId, id, { claim_json });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'claim',
    entityId: id,
    action: 'AI_SUGGESTIONS_APPLIED',
    metadata: { keys: Object.keys(updates || {}) },
  });
  return ok({ claim_json });
}
