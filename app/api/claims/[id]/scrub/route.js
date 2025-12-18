import { badRequest, ok } from '../../../../../lib/http';
import { requireAuth } from '../../../../../lib/authGuard';
import { repo } from '../../../../../lib/repo';
import { scrubClaim } from '../../../../../services/scrubber';
import { writeAudit } from '../../../../../lib/audit';

export async function POST(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER', 'CODER']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const claim = await repo.getClaim(ctx.tenantId, id);
  if (!claim) return badRequest('Claim not found');
  const scrubber = scrubClaim(claim.claim_json || {});
  await repo.updateClaim(ctx.tenantId, id, { claim_json: { ...claim.claim_json, scrubber } });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'claim',
    entityId: id,
    action: 'CLAIM_SCRUBBED',
    metadata: { valid: scrubber.valid, errorCount: scrubber.errors.length },
  });
  return ok({ scrubber });
}
