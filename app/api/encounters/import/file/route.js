import { badRequest, ok } from '../../../../../lib/http';
import { requireAuth } from '../../../../../lib/authGuard';
import { repo } from '../../../../../lib/repo';
import { writeAudit } from '../../../../../lib/audit';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx];
    });
    return row;
  });
}

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return badRequest('file required');
  const text = await file.text();
  const rows = parseCsv(text);
  if (!rows.length) return badRequest('No rows found');
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
      metadata: { source: 'csv_file' },
    });
  }
  return ok({ count: created.length });
}
