import { repo } from './repo';

export function writeAudit({ tenantId, userId, entity, entityId, action, metadata = {} }) {
  repo.addAudit({
    tenant_id: tenantId,
    user_id: userId,
    entity,
    entity_id: entityId,
    action,
    metadata,
  });
}
