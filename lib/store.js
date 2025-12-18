// Lightweight in-memory data store to mimic MySQL tables for the MVP flows.
// All queries are tenant-scoped and synchronous to align with the hard constraints.
import crypto from 'crypto';

const now = () => new Date().toISOString();

const state = {
  tenants: [{ id: 1, name: 'RCM Studio Demo', practiceName: 'RCM Studio Practice' }],
  users: [
    {
      id: 1,
      tenant_id: 1,
      email: 'demo@rcmstudio.com',
      password_hash: hashPassword('password'),
      role: 'ADMIN',
      name: 'Demo User',
    },
    {
      id: 2,
      tenant_id: 1,
      email: 'biller@rcmstudio.com',
      password_hash: hashPassword('password'),
      role: 'BILLER',
      name: 'Biller User',
    },
    {
      id: 3,
      tenant_id: 1,
      email: 'coder@rcmstudio.com',
      password_hash: hashPassword('password'),
      role: 'CODER',
      name: 'Coder User',
    },
  ],
  patients: [],
  insurances: [],
  encounters: [],
  charges: [],
  claims: [],
  denials: [],
  audit_logs: [],
};

function hashPassword(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function nextId(collection) {
  return collection.length ? Math.max(...collection.map((r) => r.id)) + 1 : 1;
}

export function verifyPassword(raw, hashed) {
  return hashPassword(raw) === hashed;
}

export function findUserByEmail(email) {
  return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function listUsers(tenantId) {
  return state.users.filter((u) => u.tenant_id === tenantId);
}

export function createUser(tenantId, payload) {
  const existing = state.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) throw new Error('Email already exists');
  const user = { ...payload, id: nextId(state.users), tenant_id: tenantId };
  state.users.push(user);
  return user;
}

export function updateUser(tenantId, id, updates) {
  const user = state.users.find((u) => u.id === id && u.tenant_id === tenantId);
  if (!user) throw new Error('User not found');
  Object.assign(user, updates);
  return user;
}

export function deleteUser(tenantId, id) {
  const idx = state.users.findIndex((u) => u.id === id && u.tenant_id === tenantId);
  if (idx === -1) throw new Error('User not found');
  const [removed] = state.users.splice(idx, 1);
  return removed;
}

export function getTenant(tenantId) {
  return state.tenants.find((t) => t.id === tenantId);
}

export function updateTenant(tenantId, updates) {
  const tenant = getTenant(tenantId);
  if (!tenant) throw new Error('Tenant not found');
  Object.assign(tenant, updates);
  return tenant;
}

export function addAudit(entry) {
  state.audit_logs.push({ id: nextId(state.audit_logs), created_at: now(), ...entry });
}

export function listPatients(tenantId) {
  return state.patients.filter((p) => p.tenant_id === tenantId);
}

export function getPatient(tenantId, id) {
  return state.patients.find((p) => p.tenant_id === tenantId && p.id === id);
}

export function upsertPatient(tenantId, payload) {
  if (payload.id) {
    const existing = state.patients.find((p) => p.id === payload.id && p.tenant_id === tenantId);
    if (!existing) throw new Error('Patient not found');
    Object.assign(existing, payload);
    return existing;
  }
  const patient = { ...payload, id: nextId(state.patients), tenant_id: tenantId };
  state.patients.push(patient);
  return patient;
}

export function addInsurance(tenantId, payload) {
  const insurance = { ...payload, id: nextId(state.insurances), tenant_id: tenantId };
  state.insurances.push(insurance);
  return insurance;
}

export function listInsurancesForPatient(tenantId, patientId) {
  return state.insurances.filter((i) => i.tenant_id === tenantId && i.patient_id === patientId);
}

export function getInsurance(tenantId, id) {
  return state.insurances.find((i) => i.tenant_id === tenantId && i.id === id);
}

export function createEncounter(tenantId, payload) {
  const encounter = { ...payload, id: nextId(state.encounters), tenant_id: tenantId, status: 'OPEN' };
  state.encounters.push(encounter);
  return encounter;
}

export function listEncounters(tenantId, filter = {}) {
  return state.encounters.filter((e) => {
    if (e.tenant_id !== tenantId) return false;
    if (filter.patientId && e.patient_id !== filter.patientId) return false;
    if (filter.withoutClaim) {
      const hasClaim = state.claims.some((c) => c.tenant_id === tenantId && c.encounter_id === e.id);
      if (hasClaim) return false;
    }
    return true;
  });
}

export function getEncounter(tenantId, id) {
  return state.encounters.find((e) => e.tenant_id === tenantId && e.id === id);
}

export function updateEncounter(tenantId, id, updates) {
  const encounter = getEncounter(tenantId, id);
  if (!encounter) throw new Error('Encounter not found');
  Object.assign(encounter, updates);
  return encounter;
}

export function addCharge(tenantId, payload) {
  const charge = { ...payload, id: nextId(state.charges), tenant_id: tenantId };
  state.charges.push(charge);
  return charge;
}

export function listChargesForEncounter(tenantId, encounterId) {
  return state.charges.filter((c) => c.tenant_id === tenantId && c.encounter_id === encounterId);
}

export function createClaim(tenantId, payload) {
  const claim = {
    ...payload,
    id: nextId(state.claims),
    tenant_id: tenantId,
    status: 'DRAFT',
    created_at: now(),
    updated_at: now(),
  };
  state.claims.push(claim);
  return claim;
}

export function updateClaim(tenantId, id, updates) {
  const claim = state.claims.find((c) => c.tenant_id === tenantId && c.id === id);
  if (!claim) throw new Error('Claim not found');
  Object.assign(claim, updates, { updated_at: now() });
  return claim;
}

export function getClaim(tenantId, id) {
  return state.claims.find((c) => c.tenant_id === tenantId && c.id === id);
}

export function listClaims(tenantId, filter = {}) {
  return state.claims.filter((c) => {
    if (c.tenant_id !== tenantId) return false;
    if (filter.status && c.status !== filter.status) return false;
    if (filter.hasScrubberErrors === true) {
      const errors = c.claim_json?.scrubber?.errors || [];
      return errors.length > 0;
    }
    return true;
  });
}

export function addDenial(tenantId, payload) {
  const denial = { ...payload, id: nextId(state.denials), tenant_id: tenantId, created_at: now() };
  state.denials.push(denial);
  return denial;
}

export function listDenialsForClaim(tenantId, claimId) {
  return state.denials.filter((d) => d.tenant_id === tenantId && d.claim_id === claimId);
}

export function recentClaims(tenantId, limit = 10) {
  return state.claims
    .filter((c) => c.tenant_id === tenantId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

export function stats(tenantId) {
  const claims = state.claims.filter((c) => c.tenant_id === tenantId);
  return {
    totalClaims: claims.length,
    submittedClaims: claims.filter((c) => c.status === 'SUBMITTED').length,
    rejectedClaims: claims.filter((c) => c.status === 'REJECTED').length,
    deniedClaims: claims.filter((c) => c.status === 'DENIED').length,
    draftClaims: claims.filter((c) => c.status === 'DRAFT').length,
  };
}

export function resetStore() {
  // Handy for future tests; not used in app runtime.
  state.patients = [];
  state.insurances = [];
  state.encounters = [];
  state.charges = [];
  state.claims = [];
  state.denials = [];
  state.audit_logs = [];
}

export function getState() {
  return state;
}
