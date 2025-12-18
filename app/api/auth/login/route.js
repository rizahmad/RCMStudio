import { NextResponse } from 'next/server';
import { sign } from '../../../../auth/jwt';
import { repo } from '../../../../lib/repo';
import { verifyPassword } from '../../../../auth/password';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function POST(request) {
  const { email, password } = await request.json();
  const user = await repo.findUserByEmail(email || '');
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const token = sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, JWT_SECRET);
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name, tenantId: user.tenant_id },
  });
  res.cookies.set({
    name: 'rcm_jwt',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
