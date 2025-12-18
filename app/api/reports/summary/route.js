import { ok } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const claims = await repo.listClaims(ctx.tenantId, {});
  const submittedCount = claims.filter((c) => c.status === 'SUBMITTED').length;
  const acceptedCount = claims.filter((c) => c.status === 'ACCEPTED').length;
  const totalSubmitted = submittedCount + acceptedCount;
  const firstPassAcceptance = totalSubmitted ? acceptedCount / totalSubmitted : 0;
  return ok({
    totalClaims: claims.length,
    submittedClaims: submittedCount,
    rejectedClaims: claims.filter((c) => c.status === 'REJECTED').length,
    deniedClaims: claims.filter((c) => c.status === 'DENIED').length,
    draftClaims: claims.filter((c) => c.status === 'DRAFT').length,
    acceptedClaims: acceptedCount,
    firstPassAcceptance,
  });
}
