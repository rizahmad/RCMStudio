// Data access layer with Prisma (MySQL) by default, falling back to in-memory store for demos.
import { prisma } from '../db/client';
import * as memory from './store';

const usePrisma = Boolean(process.env.DATABASE_URL);

const memoryRepo = {
  async findUserByEmail(email) {
    return memory.findUserByEmail(email);
  },
  async listUsers(tenantId) {
    return memory.listUsers(tenantId);
  },
  async createUser(tenantId, payload) {
    return memory.createUser(tenantId, payload);
  },
  async updateUser(tenantId, id, updates) {
    return memory.updateUser(tenantId, id, updates);
  },
  async deleteUser(tenantId, id) {
    return memory.deleteUser(tenantId, id);
  },
  async listPatients(tenantId) {
    return memory.listPatients(tenantId).map((p) => ({
      ...p,
      insurances: memory.listInsurancesForPatient(tenantId, p.id),
    }));
  },
  async getPatient(tenantId, id) {
    return memory.getPatient(tenantId, id);
  },
  async upsertPatient(tenantId, payload) {
    return memory.upsertPatient(tenantId, payload);
  },
  async addInsurance(tenantId, payload) {
    return memory.addInsurance(tenantId, payload);
  },
  async listInsurancesForPatient(tenantId, patientId) {
    return memory.listInsurancesForPatient(tenantId, patientId);
  },
  async createEncounter(tenantId, payload) {
    return memory.createEncounter(tenantId, payload);
  },
  async listEncounters(tenantId, filter) {
    return memory.listEncounters(tenantId, filter);
  },
  async getEncounter(tenantId, id) {
    return memory.getEncounter(tenantId, id);
  },
  async updateEncounter(tenantId, id, updates) {
    return memory.updateEncounter(tenantId, id, updates);
  },
  async addCharge(tenantId, payload) {
    return memory.addCharge(tenantId, payload);
  },
  async listChargesForEncounter(tenantId, encounterId) {
    return memory.listChargesForEncounter(tenantId, encounterId);
  },
  async createClaim(tenantId, payload) {
    return memory.createClaim(tenantId, payload);
  },
  async updateClaim(tenantId, id, updates) {
    return memory.updateClaim(tenantId, id, updates);
  },
  async getClaim(tenantId, id) {
    return memory.getClaim(tenantId, id);
  },
  async getClaimByEncounter(tenantId, encounterId) {
    return memory.listClaims(tenantId, {}).find((c) => c.encounter_id === encounterId) || null;
  },
  async listClaims(tenantId, filter) {
    return memory.listClaims(tenantId, filter);
  },
  async addDenial(tenantId, payload) {
    return memory.addDenial(tenantId, payload);
  },
  async listDenialsForClaim(tenantId, claimId) {
    return memory.listDenialsForClaim(tenantId, claimId);
  },
  async addAudit(entry) {
    return memory.addAudit(entry);
  },
  async getTenant(tenantId) {
    return memory.getTenant(tenantId);
  },
  async updateTenant(tenantId, updates) {
    return memory.updateTenant(tenantId, updates);
  },
};

const prismaRepo = {
  async findUserByEmail(email) {
    if (!email) return null;
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },
  async listUsers(tenantId) {
    return prisma.user.findMany({
      where: { tenant_id: tenantId },
      orderBy: { createdAt: 'desc' },
    });
  },
  async createUser(tenantId, payload) {
    return prisma.user.create({
      data: { ...payload, tenant_id: tenantId },
    });
  },
  async updateUser(tenantId, id, updates) {
    return prisma.user.update({
      where: { id },
      data: { ...updates, tenant_id: tenantId },
    });
  },
  async deleteUser(tenantId, id) {
    return prisma.user.delete({ where: { id } });
  },
  async listPatients(tenantId) {
    return prisma.patient.findMany({
      where: { tenant_id: tenantId },
      include: { insurances: true },
      orderBy: { createdAt: 'desc' },
    });
  },
  async getPatient(tenantId, id) {
    return prisma.patient.findFirst({ where: { id, tenant_id: tenantId } });
  },
  async upsertPatient(tenantId, payload) {
    if (payload.id) {
      return prisma.patient.update({
        where: { id: payload.id },
        data: { ...payload, tenant_id: tenantId },
      });
    }
    return prisma.patient.create({ data: { ...payload, tenant_id: tenantId } });
  },
  async addInsurance(tenantId, payload) {
    return prisma.insurance.create({ data: { ...payload, tenant_id: tenantId } });
  },
  async listInsurancesForPatient(tenantId, patientId) {
    return prisma.insurance.findMany({ where: { tenant_id: tenantId, patient_id: patientId } });
  },
  async createEncounter(tenantId, payload) {
    return prisma.encounter.create({ data: { ...payload, tenant_id: tenantId } });
  },
  async listEncounters(tenantId, filter = {}) {
    return prisma.encounter.findMany({
      where: {
        tenant_id: tenantId,
        patient_id: filter.patientId || undefined,
        claim: filter.withoutClaim ? null : undefined,
      },
      orderBy: { id: 'desc' },
    });
  },
  async getEncounter(tenantId, id) {
    return prisma.encounter.findFirst({ where: { id, tenant_id: tenantId } });
  },
  async updateEncounter(tenantId, id, updates) {
    return prisma.encounter.update({ where: { id }, data: { ...updates, tenant_id: tenantId } });
  },
  async addCharge(tenantId, payload) {
    return prisma.charge.create({ data: { ...payload, tenant_id: tenantId } });
  },
  async listChargesForEncounter(tenantId, encounterId) {
    return prisma.charge.findMany({
      where: { tenant_id: tenantId, encounter_id: encounterId },
      orderBy: { id: 'asc' },
    });
  },
  async createClaim(tenantId, payload) {
    return prisma.claim.create({
      data: {
        ...payload,
        tenant_id: tenantId,
        claim_json: payload.claim_json || {},
      },
    });
  },
  async updateClaim(tenantId, id, updates) {
    const data = { ...updates };
    if (Object.prototype.hasOwnProperty.call(updates, 'claim_json')) {
      data.claim_json = updates.claim_json;
    }
    return prisma.claim.update({
      where: { id },
      data,
    });
  },
  async getClaim(tenantId, id) {
    return prisma.claim.findFirst({ where: { id, tenant_id: tenantId } });
  },
  async getClaimByEncounter(tenantId, encounterId) {
    return prisma.claim.findFirst({ where: { tenant_id: tenantId, encounter_id: encounterId } });
  },
  async listClaims(tenantId, filter = {}) {
    const claims = await prisma.claim.findMany({
      where: {
        tenant_id: tenantId,
        status: filter.status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (filter.hasScrubberErrors) {
      return claims.filter((c) => {
        const errors = c.claim_json?.scrubber?.errors || [];
        return errors.length > 0;
      });
    }
    return claims;
  },
  async addDenial(tenantId, payload) {
    return prisma.denial.create({ data: { ...payload, tenant_id: tenantId } });
  },
  async listDenialsForClaim(tenantId, claimId) {
    return prisma.denial.findMany({ where: { tenant_id: tenantId, claim_id: claimId } });
  },
  async addAudit(entry) {
    return prisma.auditLog.create({
      data: {
        tenant_id: entry.tenant_id,
        user_id: entry.user_id || null,
        entity: entry.entity,
        entity_id: entry.entity_id || null,
        action: entry.action,
        metadata: entry.metadata || {},
      },
    });
  },
  async getTenant(tenantId) {
    return prisma.tenant.findUnique({ where: { id: tenantId } });
  },
  async updateTenant(tenantId, updates) {
    return prisma.tenant.update({ where: { id: tenantId }, data: updates });
  },
};

export const repo = usePrisma ? prismaRepo : memoryRepo;
export const usingPrisma = usePrisma;
