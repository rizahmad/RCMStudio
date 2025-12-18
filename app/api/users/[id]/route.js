import { ok, badRequest } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';
import { writeAudit } from '../../../../lib/audit';
import { hashPassword } from '../../../../auth/password';

export async function PUT(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  const body = await request.json();
  const updates = {};
  if (body.email) updates.email = body.email.toLowerCase();
  if (body.name !== undefined) updates.name = body.name;
  if (body.role) updates.role = body.role;
  if (body.password) updates.password_hash = hashPassword(body.password);
  const user = await repo.updateUser(ctx.tenantId, id, updates);
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'user',
    entityId: user.id,
    action: 'USER_UPDATED',
  });
  return ok({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
}

export async function DELETE(request, { params }) {
  const { ctx, error } = requireAuth(request, ['ADMIN']);
  if (error) return error;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return badRequest('Invalid id');
  await repo.deleteUser(ctx.tenantId, id);
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'user',
    entityId: id,
    action: 'USER_DELETED',
  });
  return ok({ ok: true });
}
