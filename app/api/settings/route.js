import { ok, badRequest } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const tenant = await repo.getTenant(ctx.tenantId);
  return ok({
    practiceName: tenant?.practiceName || '',
    npi: tenant?.npi || '',
    taxId: tenant?.taxId || '',
    address: tenant?.address || '',
  });
}

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const body = await request.json();
  const { practiceName, npi, taxId, address } = body || {};
  if (!practiceName) return badRequest('practiceName required');
  await repo.updateTenant(ctx.tenantId, { practiceName, npi, taxId, address });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'tenant',
    entityId: ctx.tenantId,
    action: 'SETTINGS_UPDATED',
  });
  return ok({ ok: true });
}
