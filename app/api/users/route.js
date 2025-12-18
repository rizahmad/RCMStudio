import { ok, badRequest } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';
import { hashPassword } from '../../../auth/password';

export async function GET(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const users = await repo.listUsers(ctx.tenantId);
  const safeUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.name,
  }));
  return ok({ users: safeUsers });
}

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const body = await request.json();
  const { email, password, role, name } = body || {};
  if (!email || !password || !role) return badRequest('email, password, and role required');
  const user = await repo.createUser(ctx.tenantId, {
    email: email.toLowerCase(),
    password_hash: hashPassword(password),
    role,
    name: name || '',
  });
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'user',
    entityId: user.id,
    action: 'USER_CREATED',
  });
  return ok({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
}
