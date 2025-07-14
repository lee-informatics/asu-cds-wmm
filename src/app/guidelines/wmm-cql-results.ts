// Author: Preston Lee

import { Condition, Observation, Parameters } from "fhir/r4";

export class WmmCqlResults {

    public patientAge: number | null = null;
    public patientName: string | null = null;
    public weightRelatedConditions: Condition[] = [];
    public lifeThreateningWeightRelatedConditions: Condition[] = [];
    public establishedCardiovascularConditions: Condition[] = [];
    public hFpEFObservations: Observation[] = [];

    public bmi: Observation | null = null;
    public bmiValue: string | null = null;
    public hasBmi27To30: boolean = false;
    public hasBmi30To35: boolean = false;
    public hasBmi35To40: boolean = false;
    public hasBmiOver40: boolean = false;

    public tier1: boolean = false;

    public tier1a: boolean = false;
    public tier1b: boolean = false;
    public tier1bi: boolean = false;
    public tier1bii: boolean = false;
    public tier1biii: boolean = false;
    public tier1biv: boolean = false;

    public tier2: boolean = false;
    
    public tier2a: boolean = false;
    public tier2ai: boolean = false;
    public tier2aii: boolean = false;
    public tier2aiii: boolean = false;
    public tier2aiv: boolean = false;

    public tier2b: boolean = false;
    public tier2bi: boolean = false;
    public tier2bii: boolean = false;
    public tier2biii: boolean = false;
    public tier2biv: boolean = false;

    public tier2c: boolean = false;
    public tier2ci: boolean = false;
    public tier2cii: boolean = false;
    public tier2ciii: boolean = false;
    public tier2civ: boolean = false;

    public tier3: boolean = false;

    public tier3i: boolean = false;
    public tier3ii: boolean = false;
    public tier3iii: boolean = false;

    public loadFromParameters(parameters: Parameters) {
        const params = parameters.parameter;
        if (params) {
            this.patientAge = params.find(p => p.name === 'PatientAge')?.valueInteger || null;
            this.patientName = params.find(p => p.name === 'PatientName')?.valueString || null;

            this.weightRelatedConditions = params.filter(p => p.name === 'All Weight Related Conditions' && p.resource)
                .map(p => p.resource as Condition);
            this.lifeThreateningWeightRelatedConditions = params.filter(p => p.name === 'Life Threatening Weight Related Conditions' && p.resource)
                .map(p => p.resource as Condition);
            this.establishedCardiovascularConditions = params.filter(p => p.name === 'Established Cardiovascular Conditions' && p.resource)
                .map(p => p.resource as Condition);
            this.hFpEFObservations = params.filter(p => p.name === 'HFpEF Observations' && p.resource)
                .map(p => p.resource as Observation);

            this.bmi = params.find(p => p.name === 'BMI')?.resource as Observation;
            this.bmiValue = params.find(p => p.name === 'BMIValue')?.valueString || null;
            this.hasBmi27To30 = params.some(p => p.name === 'HasBMI27To30' && p.valueBoolean === true);
            this.hasBmi30To35 = params.some(p => p.name === 'HasBMI30To35' && p.valueBoolean === true);
            this.hasBmi35To40 = params.some(p => p.name === 'HasBMI35To40' && p.valueBoolean === true);
            this.hasBmiOver40 = params.some(p => p.name === 'HasBMIOver40' && p.valueBoolean === true);

            this.tier1a = this.lifeThreateningWeightRelatedConditions.length > 0

            this.tier1bi = this.patientAge !== null && this.patientAge > 45 && this.establishedCardiovascularConditions.length > 0 && this.hasBmiOver40;
            this.tier1bii = this.patientAge !== null && this.patientAge > 45 && this.establishedCardiovascularConditions.length > 0 && this.hasBmi35To40;
            this.tier1biii = this.patientAge !== null && this.patientAge > 45 && this.establishedCardiovascularConditions.length > 0 && this.hasBmi30To35;
            this.tier1biv = this.patientAge !== null && this.patientAge > 45 && this.establishedCardiovascularConditions.length > 0 && this.hasBmi27To30;
            this.tier1b = this.tier1bi || this.tier1bii || this.tier1biii || this.tier1biv;

            this.tier1 = this.tier1a || this.tier1b;

            this.tier2ai = this.weightRelatedConditions.length >= 3 && this.hasBmiOver40;
            this.tier2aii = this.weightRelatedConditions.length > 3 && this.hasBmi35To40;
            this.tier2aiii = this.weightRelatedConditions.length > 3 && this.hasBmi30To35;
            this.tier2aiv = this.weightRelatedConditions.length > 3 && this.hasBmi27To30;
            this.tier2a = this.tier2ai || this.tier2aii || this.tier2aiii || this.tier2aiv;
            
            this.tier2bi = this.weightRelatedConditions.length >= 2 && this.hasBmiOver40
            this.tier2bii = this.weightRelatedConditions.length >= 2 && this.hasBmi35To40;
            this.tier2biii = this.weightRelatedConditions.length >= 2 && this.hasBmi30To35;
            this.tier2biv = this.weightRelatedConditions.length >= 2 && this.hasBmi27To30;
            this.tier2b = this.tier2bi || this.tier2bii || this.tier2biii || this.tier2biv;
            
            this.tier2ci = this.weightRelatedConditions.length >= 1 && this.hasBmiOver40
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
    }
}