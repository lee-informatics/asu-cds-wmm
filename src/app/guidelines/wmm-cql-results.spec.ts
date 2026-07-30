import { Parameters } from 'fhir/r4';
import { WmmCqlResults } from './wmm-cql-results';

const medicationLibraryParameters: Parameters = {
  resourceType: 'Parameters',
  parameter: [
    {
      name: 'Patient',
      resource: {
        resourceType: 'Patient',
        name: [{ given: ['Sheba703'], family: 'Test' }],
        birthDate: '1970-01-01',
      },
    },
    { name: 'UsedBMI', valueQuantity: { value: 24.4 } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c1' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c2' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c3' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c4' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c5' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c6' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c7' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c8' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c9' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c10' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c11' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c12' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c13' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c14' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c15' } },
    { name: 'AllWeightRelatedConditions', resource: { resourceType: 'Condition', id: 'c16' } },
    { name: 'IsTier2b', valueBoolean: false },
    { name: 'HasBMI35To40', valueBoolean: false },
    { name: 'HasBMIOver40', valueBoolean: false },
    { name: 'HasBMI30To35', valueBoolean: false },
    { name: 'HasBMI27To30', valueBoolean: false },
  ],
} as Parameters;

describe('WmmCqlResults', () => {
  it('loads WeightManagementMedication parameter names from CQL output', () => {
    const results = new WmmCqlResults();
    results.loadFromParameters(medicationLibraryParameters);

    expect(results.weightRelatedConditions.length).toBe(16);
    expect(results.patientName).toContain('Sheba703');
    expect(results.bmiValue).toBe('24.4');
  });

  it('highlights tier rows from CQL IsTier parameters and BMI bands', () => {
    const results = new WmmCqlResults();
    results.loadFromParameters({
      resourceType: 'Parameters',
      parameter: [
        { name: 'IsTier2b', valueBoolean: true },
        { name: 'HasBMI35To40', valueBoolean: true },
        { name: 'HasBMIOver40', valueBoolean: false },
        { name: 'HasBMI30To35', valueBoolean: false },
        { name: 'HasBMI27To30', valueBoolean: false },
      ],
    });

    expect(results.tier2).toBeTrue();
    expect(results.tier2b).toBeTrue();
    expect(results.tier2bii).toBeTrue();
    expect(results.tier2bi).toBeFalse();
  });

  it('keeps legacy parameter-name support for client-side tier calculation', () => {
    const results = new WmmCqlResults();
    results.loadFromParameters({
      resourceType: 'Parameters',
      parameter: [
        { name: 'PatientAge', valueInteger: 50 },
        { name: 'HasBMIOver40', valueBoolean: true },
        {
          name: 'Established Cardiovascular Conditions',
          resource: { resourceType: 'Condition', id: 'c1' },
        },
      ],
    });

    expect(results.tier1b).toBeTrue();
    expect(results.tier1bi).toBeTrue();
    expect(results.tier1).toBeTrue();
  });
});
