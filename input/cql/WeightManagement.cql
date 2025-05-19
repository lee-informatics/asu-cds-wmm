//  Authors: Preston Lee

library WeightManagement version '0.1.0'

codesystem "SNOMED": 'http://snomed.info/sct'
codesystem "LOINC": 'http://loinc.org'
codesystem "ConditionClinical": 'http://terminology.hl7.org/CodeSystem/condition-clinical'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

valueset "Female Administrative Sex": '2.16.840.1.113883.3.560.100.2'

define "BMICodes":
  { Code '39156-5' from "LOINC" }

define "WeightRelatedConditions":
  { Code '162864005' from SNOMED, Code '414545008' from SNOMED, // "Ischemic heart disease (disorder)"'
  Code '59621000' from SNOMED, //'Essential hypertension (disorder)"'
  Code '414545008' from SNOMED // Ischemic heart disease (disorder)"
  }

define "Active Condition":
  { Code 'active' from ConditionClinical, Code 'recurrence' from ConditionClinical }

context Patient

define IsMale:
  Patient.gender = 'male'

define function HasBMIOver(bmi System.Quantity):
  exists ( ["Observation": "BMICodes"] O
      where O.status in { 'final', 'amended', 'corrected' }
        and O.value > bmi
  )

define function HasBMIBetween(low System.Quantity, high System.Quantity):
  First(["Observation": "BMICodes"] O
      where O.value as Quantity >= low
        and O.value as Quantity < high
        and O.status in { 'final', 'amended', 'corrected' }
        and O.issued is not null
        // sort by issued desc
  
  )

define function CountWeightRelatedConditions():
  Count(["Condition": "WeightRelatedConditions"] C
      where C.onset is not null
        // and C.clinicalStatus in "Active Condition"
      // and C.verificationStatus in { 'confirmed', 'provisional' }  
  
  
  )

define "Has BMI Over 40":
  HasBMIOver(40.0 'kg/m2')

define "Has BMI >= 27 and < 30 kg/m2":
  HasBMIBetween(27.0 'kg/m2', 30.0 'kg/m2')

define "Has BMI >= 30 and < 35 kg/m2":
  HasBMIBetween(30.0 'kg/m2', 35.0 'kg/m2')

define "Has BMI >= 35 and < 40 kg/m2":
  HasBMIBetween(35.0 'kg/m2', 40.0 'kg/m2')
    //  R where R.value as Quantity > 45 'kg/m2']
    // )
// define "InDemographic":
//     AgeInYears() >= 16 and AgeInYears() < 24 and "Patient"."gender" in "Female Administrative Sex"





define "Is Tier 3":
  HasBMIOver(30 'kg/m2')

define "Number Weight Related Conditions":
  CountWeightRelatedConditions()