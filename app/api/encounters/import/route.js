import { ok, badRequest } from '../../../../lib/http';
import { requireAuth } from '../../../../lib/authGuard';
import { repo } from '../../../../lib/repo';
import { writeAudit } from '../../../../lib/audit';

// Minimal CSV import stub: accepts JSON array of rows (already parsed)
// Each row requires patient_id, date_of_service, provider_npi, place_of_service, notes
export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const body = await request.json();
  const rows = body?.rows;
  if (!Array.isArray(rows) || !rows.length) return badRequest('rows array required');
  const created = [];
  for (const row of rows) {
    if (!row.patient_id) continue;
    const encounter = await repo.createEncounter(ctx.tenantId, {
      patient_id: Number(row.patient_id),
      date_of_service: row.date_of_service || null,
      provider_npi: row.provider_npi || '',
      place_of_service: row.place_of_service || '',
      notes: row.notes || '',
    });
    created.push(encounter);
    writeAudit({
      tenantId: ctx.tenantId,
      userId: ctx.user.id,
      entity: 'encounter',
      entityId: encounter.id,
      action: 'ENCOUNTER_IMPORTED',
      metadata: { source: 'csv_stub' },
    });
  }
  return ok({ count: created.length });
}
