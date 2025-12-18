import { ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { usingPrisma } from '../../../lib/repo';
import { prisma } from '../../../db/client';
import { getState } from '../../../lib/store';

export async function GET(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity') || undefined;
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined;
  // Pull recent audit logs; include user context when available
  if (usingPrisma && prisma) {
    const logs = await prisma.auditLog.findMany({
      where: { tenant_id: ctx.tenantId, entity: entity || undefined, user_id: userId || undefined },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok({ logs });
  }
  const state = getState();
  let logs = state.audit_logs.filter((l) => l.tenant_id === ctx.tenantId);
  if (entity) logs = logs.filter((l) => l.entity === entity);
  if (userId) logs = logs.filter((l) => l.user_id === userId);
  logs = logs.slice(-50).reverse();
  return ok({ logs });
}
