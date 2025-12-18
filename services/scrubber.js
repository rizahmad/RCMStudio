const CPT_PATTERN = /^[A-Z0-9]{4,5}$/i;
const ICD_PATTERN = /^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/i;

export function scrubClaim(claimJson) {
  const errors = [];

  if (!claimJson.patient?.dob) errors.push({ field: 'patient.dob', message: 'Missing patient DOB' });
  if (!claimJson.subscriber?.memberId) errors.push({ field: 'subscriber.memberId', message: 'Missing member ID' });
  if (!claimJson.renderingProvider?.npi) errors.push({ field: 'renderingProvider.npi', message: 'Missing rendering provider NPI' });

  (claimJson.serviceLines || []).forEach((line, idx) => {
    if (!line.cpt || !CPT_PATTERN.test(line.cpt)) {
      errors.push({ field: `serviceLines[${idx}].cpt`, message: 'Invalid CPT format' });
    }
    if (!line.icd10 || !ICD_PATTERN.test(line.icd10)) {
      errors.push({ field: `serviceLines[${idx}].icd10`, message: 'Invalid ICD-10 format' });
    }
    if (line.modifier && !line.cpt) {
      errors.push({ field: `serviceLines[${idx}].modifier`, message: 'Modifier present without CPT' });
    }
  });

  return { valid: errors.length === 0, errors, ranAt: new Date().toISOString() };
}
