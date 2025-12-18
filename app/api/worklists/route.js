import { ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const statuses = ['DRAFT', 'SUBMITTED', 'REJECTED', 'DENIED'];
  const result = {};
  for (const status of statuses) {
    const claims = await repo.listClaims(ctx.tenantId, { status });
    result[status.toLowerCase()] = await Promise.all(
      claims.map(async (c) => ({
        ...c,
        patient: await repo.getPatient(ctx.tenantId, c.patient_id),
      }))
    );
  }
  const scrubberList = await repo.listClaims(ctx.tenantId, { hasScrubberErrors: true });
  result.scrubberErrors = await Promise.all(
    scrubberList.map(async (c) => ({
      ...c,
      patient: await repo.getPatient(ctx.tenantId, c.patient_id),
    }))
  );
  return ok(result);
}
