export function buildClaimJson({ patient, insurance, encounter, charges, tenant }) {
  return {
    billingProvider: { npi: tenant?.npi || '', taxId: tenant?.taxId || '' },
    renderingProvider: { npi: encounter.provider_npi || '' },
    subscriber: {
      name: insurance?.subscriber_name || '',
      memberId: insurance?.member_id || '',
      dob: insurance?.subscriber_dob || '',
    },
    patient: {
      name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      dob: patient.dob || '',
    },
    serviceLines: charges.map((c) => ({
      cpt: c.cpt || '',
      icd10: c.icd10 || '',
      modifier: c.modifier || '',
      units: Number(c.units || 1),
      charge: Number(c.charge_amount || 0),
    })),
  };
}
