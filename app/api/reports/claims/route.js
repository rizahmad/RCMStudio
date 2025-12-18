import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const claims = await repo.listClaims(ctx.tenantId, {});
  const rows = [
    ['id', 'status', 'patient_id', 'encounter_id', 'submittedAt', 'createdAt'].join(','),
    ...claims.map((c) =>
      [
        c.id,
        c.status,
        c.patient_id,
        c.encounter_id,
        c.submittedAt || '',
        c.createdAt || '',
      ].join(',')
    ),
  ];
  const csv = rows.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="claims.csv"',
    },
  });
}
