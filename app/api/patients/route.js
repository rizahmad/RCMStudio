import { badRequest, ok } from '../../../lib/http';
import { requireAuth } from '../../../lib/authGuard';
import { repo } from '../../../lib/repo';
import { writeAudit } from '../../../lib/audit';

export async function GET(request) {
  const { ctx, error } = requireAuth(request);
  if (error) return error;
  const patients = await repo.listPatients(ctx.tenantId);
  return ok({ patients });
}

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const body = await request.json();
  const { patient, insurance } = body;
  if (!patient?.first_name || !patient?.last_name) {
    return badRequest('First and last name are required');
  }
  const saved = await repo.upsertPatient(ctx.tenantId, patient);
  if (insurance && Object.keys(insurance).length) {
    await repo.addInsurance(ctx.tenantId, { ...insurance, patient_id: saved.id });
  }
  writeAudit({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    entity: 'patient',
    entityId: saved.id,
    action: patient?.id ? 'PATIENT_UPDATED' : 'PATIENT_CREATED',
    metadata: { insuranceAdded: Boolean(insurance) },
  });
  return ok({ patient: saved });
}
