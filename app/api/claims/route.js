import { ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const hasScrubberErrors = searchParams.get('hasScrubberErrors') === 'true';
  const rawClaims = await repo.listClaims(ctx.tenantId, { status, hasScrubberErrors });
  const claims = await Promise.all(
    rawClaims.map(async (c) => ({
      ...c,
      patient: await repo.getPatient(ctx.tenantId, c.patient_id),
      encounter: await repo.getEncounter(ctx.tenantId, c.encounter_id),
      denials: await repo.listDenialsForClaim(ctx.tenantId, c.id),
    }))
  );
  return ok({ claims });
}
