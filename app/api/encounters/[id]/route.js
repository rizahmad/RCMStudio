import { badRequest, ok } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';

export async function GET(request, { params }) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const encounter = await repo.getEncounter(ctx.tenantId, id);
  if (!encounter) return badRequest('Encounter not found');
  const charges = await repo.listChargesForEncounter(ctx.tenantId, id);
  const claim = await repo.getClaimByEncounter(ctx.tenantId, id);
  return ok({ encounter, charges, claim });
}
