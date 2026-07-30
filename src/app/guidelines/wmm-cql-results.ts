// Author: Preston Lee

import { Condition, Observation, Parameters, Patient } from 'fhir/r4';
import { yearsBetween } from '../date-utils';

type ParameterList = NonNullable<Parameters['parameter']>;

export class WmmCqlResults {
  public patientAge: number | null = null;
  public patientName: string | null = null;
  public weightRelatedConditions: Condition[] = [];
  public lifeThreateningWeightRelatedConditions: Condition[] = [];
  public establishedCardiovascularConditions: Condition[] = [];
  public hFpEFObservations: Observation[] = [];

  public bmi: Observation | null = null;
  public bmiValue: string | null = null;
  public hasBmi27To30 = false;
  public hasBmi30To35 = false;
  public hasBmi35To40 = false;
  public hasBmiOver40 = false;

  public tier1 = false;
  public tier1a = false;
  public tier1b = false;
  public tier1bi = false;
  public tier1bii = false;
  public tier1biii = false;
  public tier1biv = false;

  public tier2 = false;
  public tier2a = false;
  public tier2ai = false;
  public tier2aii = false;
  public tier2aiii = false;
  public tier2aiv = false;

  public tier2b = false;
  public tier2bi = false;
  public tier2bii = false;
  public tier2biii = false;
  public tier2biv = false;

  public tier2c = false;
  public tier2ci = false;
  public tier2cii = false;
  public tier2ciii = false;
  public tier2civ = false;

  public tier3 = false;
  public tier3i = false;
  public tier3ii = false;
  public tier3iii = false;

  public loadFromParameters(parameters: Parameters): void {
    const params = parameters.parameter;
    if (!params) {
      return;
    }

    this.loadPatient(params);
    this.loadClinicalData(params);
    this.loadBmiFlags(params);
    this.loadTierHighlights(params);
  }

  private loadPatient(params: ParameterList): void {
    const patient = params.find(p => p.name === 'Patient' && p.resource?.resourceType === 'Patient')
      ?.resource as Patient | undefined;

    if (patient) {
      const name = patient.name?.[0];
      this.patientName = name?.text
        ?? ([name?.given?.join(' '), name?.family].filter(Boolean).join(' ').trim() || null);
      if (patient.birthDate) {
        this.patientAge = yearsBetween(patient.birthDate);
      }
    }

    this.patientAge ??= params.find(p => p.name === 'PatientAge')?.valueInteger ?? null;
    this.patientName ??= params.find(p => p.name === 'PatientName')?.valueString ?? null;
  }

  private loadClinicalData(params: ParameterList): void {
    this.weightRelatedConditions = this.resourcesByName(params, [
      'All Weight Related Conditions',
      'AllWeightRelatedConditions',
    ]) as Condition[];

    this.lifeThreateningWeightRelatedConditions = this.resourcesByName(params, [
      'Life Threatening Weight Related Conditions',
      'LifeThreateningWeightRelatedConditions',
    ]) as Condition[];

    this.establishedCardiovascularConditions = this.resourcesByName(params, [
      'Established Cardiovascular Conditions',
      'EstablishedCardiovascularConditions',
    ]) as Condition[];

    this.hFpEFObservations = this.resourcesByName(params, [
      'HFpEF Observations',
      'HFpEFObservations',
    ]) as Observation[];

    this.bmi = (params.find(p => p.name === 'BMI')?.resource
      ?? params.find(p => p.name === 'MostRecentRecordedBMI')?.resource) as Observation | undefined ?? null;

    const usedBmi = params.find(p => p.name === 'UsedBMI')?.valueQuantity?.value
      ?? params.find(p => p.name === 'ComputedBMI')?.valueQuantity?.value;
    this.bmiValue = params.find(p => p.name === 'BMIValue')?.valueString
      ?? (usedBmi != null ? String(usedBmi) : null);
  }

  private loadBmiFlags(params: ParameterList): void {
    this.hasBmi27To30 = this.booleanParam(params, 'HasBMI27To30');
    this.hasBmi30To35 = this.booleanParam(params, 'HasBMI30To35');
    this.hasBmi35To40 = this.booleanParam(params, 'HasBMI35To40');
    this.hasBmiOver40 = this.booleanParam(params, 'HasBMIOver40');
  }

  private loadTierHighlights(params: ParameterList): void {
    if (params.some(p => p.name?.startsWith('IsTier'))) {
      this.loadTiersFromCql(params);
      return;
    }

    this.loadTiersFromClinicalData();
  }

  private loadTiersFromCql(params: ParameterList): void {
    this.tier1a = this.booleanParam(params, 'IsTier1a');
    this.tier1b = this.booleanParam(params, 'IsTier1b');
    this.tier2a = this.booleanParam(params, 'IsTier2a');
    this.tier2b = this.booleanParam(params, 'IsTier2b');
    this.tier2c = this.booleanParam(params, 'IsTier2c');
    this.tier3 = this.booleanParam(params, 'IsTier3');

    this.tier1 = this.tier1a || this.tier1b;
    this.tier2 = this.tier2a || this.tier2b || this.tier2c;

    this.applyBmiSubtiers('tier1b', this.tier1b);
    this.applyBmiSubtiers('tier2a', this.tier2a);
    this.applyBmiSubtiers('tier2b', this.tier2b);
    this.applyBmiSubtiers('tier2c', this.tier2c);
    this.applyBmiSubtiers('tier3', this.tier3);
  }

  private loadTiersFromClinicalData(): void {
    this.tier1a = this.lifeThreateningWeightRelatedConditions.length > 0;

    this.tier1bi = this.patientAge !== null && this.patientAge > 45
      && this.establishedCardiovascularConditions.length > 0 && this.hasBmiOver40;
    this.tier1bii = this.patientAge !== null && this.patientAge > 45
      && this.establishedCardiovascularConditions.length > 0 && this.hasBmi35To40;
    this.tier1biii = this.patientAge !== null && this.patientAge > 45
      && this.establishedCardiovascularConditions.length > 0 && this.hasBmi30To35;
    this.tier1biv = this.patientAge !== null && this.patientAge > 45
      && this.establishedCardiovascularConditions.length > 0 && this.hasBmi27To30;
    this.tier1b = this.tier1bi || this.tier1bii || this.tier1biii || this.tier1biv;
    this.tier1 = this.tier1a || this.tier1b;

    this.tier2ai = this.weightRelatedConditions.length >= 3 && this.hasBmiOver40;
    this.tier2aii = this.weightRelatedConditions.length >= 3 && this.hasBmi35To40;
    this.tier2aiii = this.weightRelatedConditions.length >= 3 && this.hasBmi30To35;
    this.tier2aiv = this.weightRelatedConditions.length >= 3 && this.hasBmi27To30;
    this.tier2a = this.tier2ai || this.tier2aii || this.tier2aiii || this.tier2aiv;

    this.tier2bi = this.weightRelatedConditions.length >= 2 && this.hasBmiOver40;
    this.tier2bii = this.weightRelatedConditions.length >= 2 && this.hasBmi35To40;
    this.tier2biii = this.weightRelatedConditions.length >= 2 && this.hasBmi30To35;
    this.tier2biv = this.weightRelatedConditions.length >= 2 && this.hasBmi27To30;
    this.tier2b = this.tier2bi || this.tier2bii || this.tier2biii || this.tier2biv;

    this.tier2ci = this.weightRelatedConditions.length >= 1 && this.hasBmiOver40;
    this.tier2cii = this.weightRelatedConditions.length >= 1 && this.hasBmi35To40;
    this.tier2ciii = this.weightRelatedConditions.length >= 1 && this.hasBmi30To35;
    this.tier2civ = this.weightRelatedConditions.length >= 1 && this.hasBmi27To30;
    this.tier2c = this.tier2ci || this.tier2cii || this.tier2ciii || this.tier2civ;
    this.tier2 = this.tier2a || this.tier2b || this.tier2c;

    this.tier3i = this.hasBmiOver40;
    this.tier3ii = this.hasBmi35To40;
    this.tier3iii = this.hasBmi30To35;
    this.tier3 = this.tier3i || this.tier3ii || this.tier3iii;
  }

  private applyBmiSubtiers(group: 'tier1b' | 'tier2a' | 'tier2b' | 'tier2c' | 'tier3', active: boolean): void {
    const over40 = active && this.hasBmiOver40;
    const bmi35To40 = active && this.hasBmi35To40;
    const bmi30To35 = active && this.hasBmi30To35;
    const bmi27To30 = active && this.hasBmi27To30;

    switch (group) {
      case 'tier1b':
        this.tier1bi = over40;
        this.tier1bii = bmi35To40;
        this.tier1biii = bmi30To35;
        this.tier1biv = bmi27To30;
        break;
      case 'tier2a':
        this.tier2ai = over40;
        this.tier2aii = bmi35To40;
        this.tier2aiii = bmi30To35;
        this.tier2aiv = bmi27To30;
        break;
      case 'tier2b':
        this.tier2bi = over40;
        this.tier2bii = bmi35To40;
        this.tier2biii = bmi30To35;
        this.tier2biv = bmi27To30;
        break;
      case 'tier2c':
        this.tier2ci = over40;
        this.tier2cii = bmi35To40;
        this.tier2ciii = bmi30To35;
        this.tier2civ = bmi27To30;
        break;
      case 'tier3':
        this.tier3i = over40;
        this.tier3ii = bmi35To40;
        this.tier3iii = bmi30To35;
        break;
    }
  }

  private booleanParam(params: ParameterList, name: string): boolean {
    return params.some(p => p.name === name && p.valueBoolean === true);
  }

  private resourcesByName(params: ParameterList, names: string[]) {
    return params
      .filter(p => p.name != null && names.includes(p.name) && p.resource)
      .map(p => p.resource);
  }
}
