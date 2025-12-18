import { ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const { user, tenantId } = ctx;
  return ok({ user: { id: user.id, email: user.email, role: user.role, name: user.name, tenantId } });
}
