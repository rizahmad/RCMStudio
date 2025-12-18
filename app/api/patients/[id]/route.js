import { ok, badRequest } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';

export async function GET(request, { params }) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const patient = await repo.getPatient(ctx.tenantId, id);
  if (!patient) return badRequest('Patient not found');
  const insurances = await repo.listInsurancesForPatient(ctx.tenantId, id);
  return ok({ patient, insurances });
}
