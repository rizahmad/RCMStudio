import { NextResponse } from 'next/server';
import { verify as verifyJwt } from '../auth/jwt';
import { COOKIE_NAME } from '../auth/cookies';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function getAuthContext(request) {
  const token = request?.cookies?.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifyJwt(token, JWT_SECRET);
    // Trust JWT payload for user/tenant context; DB lookup is avoided to keep this sync.
    return { user: { id: payload.userId, role: payload.role }, tenantId: payload.tenantId };
  } catch (err) {
    console.error('[auth] token error', err.message);
    return null;
  }
}

export function requireAuth(request, roles = []) {
  const ctx = getAuthContext(request);
  if (!ctx) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (roles.length && !roles.includes(ctx.user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ctx };
}
