library WeightManagement version '0.2.0'

codesystem SNOMED: 'http://snomed.info/sct'
codesystem LOINC: 'http://loinc.org'
codesystem "ConditionClinicalStatus": 'http://terminology.hl7.org/CodeSystem/condition-clinical'
codesystem "ConditionVerificationStatus": 'http://terminology.hl7.org/CodeSystem/condition-ver-status'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
// valueset "Female Administrative Sex": '2.16.840.1.113883.3.560.100.2'


define "BMI Observations":
  { Code '39156-5' from LOINC display 'Body mass index (BMI) [Ratio]' } as List<Code>

define "Weight Related Conditions":
  { Code '162864005' from SNOMED display 'Body mass index 30+ - obesity (finding)', Code '414545008' from SNOMED display 'Ischemic heart disease (disorder)', Code '59621000' from SNOMED display 'Essential hypertension (disorder)' } as List<Code>

define "Cardiovascular Diseases":
  { Code '162864005' from SNOMED display 'Body mass index 30+ - obesity (finding)', Code '414545008' from SNOMED display 'Ischemic heart disease (disorder)', Code '59621000' from SNOMED display 'Essential hypertension (disorder)' } as List<Code>

define "HFpEF Conditions":
  { Code '10230-1' from LOINC display 'Left ventricular Ejection fraction' } as List<Code>

define "Active Condition":
  { Code 'active' from ConditionClinicalStatus, Code 'recurrence' from ConditionClinicalStatus } as List<Code>

define "Confirmed":
  { Code 'confirmed' from ConditionVerificationStatus } as List<Code>

context Patient

define function MostRecentBMI():
  Last([Observation: "BMI Observations"] O
      where O.status in { 'final', 'amended', 'corrected' }
        and O.effective is not null
        // and O.code.coding in "BMI Observations"
      
      sort by start of effective asc
  )

define function HasBMIOver(bmi System.Quantity):
  MostRecentBMI().value as Quantity > bmi

define function HasBMIBetween(low System.Quantity, high System.Quantity):
  MostRecentBMI().value as Quantity >= low
    and MostRecentBMI().value as Quantity < high

define function WeightRelatedConditions():
  [Condition: "Weight Related Conditions"] C
    where C.onset is not null
      and exists ( C.clinicalStatus.coding CC
          where CC in "Active Condition"
      )
      and exists ( C.verificationStatus.coding VS
          where VS in "Confirmed"
      )

define function EstablishedCardiovascularDiseases():
  ["Condition"] C
    where exists ( C.code.coding Oc
        where Oc in "Cardiovascular Diseases"
    )
      and exists ( C.verificationStatus.coding Vs
          where Vs in "Active Condition"
      )

define function HFpEFObservations():
  ["Observation"] O
    where exists ( O.code.coding Oc
        where Oc in "HFpEF Conditions"
    )
      and O.status in { 'final', 'amended' }
      
// Exposed Functions


define PatientName:
  First(First(Patient.name).given) + ' ' + First(Patient.name).family

define PatientAge:
  AgeInYears()

define HasBMIOver40:
  HasBMIOver(40.0 'kg/m2')

define HasBMI35To40:
  HasBMIBetween(35.0 'kg/m2', 40.0 'kg/m2')

define HasBMI30To35:
  HasBMIBetween(30.0 'kg/m2', 35.0 'kg/m2')

define HasBMI27To30:
  HasBMIBetween(27.0 'kg/m2', 30.0 'kg/m2')

define BMI:
  MostRecentBMI()

define BMIValue:
  ( MostRecentBMI().value as Quantity ) bmi
    return ToString(bmi.value.value) + ' ' + bmi.unit.value

// define IsTier1a:
//   // TODO
  
//   false

// define IsTier1b:
//   AgeInYears() >= 45
//     and Exists(EstablishedCardiovascularDiseases())
//     and ( HasBMI27To30 or HasBMI30To35 or HasBMI35To40 or HasBMIOver40 )



// define IsTier3:
//   IsTier3i
//     or IsTier3ii
//     or IsTier3iii


define "Life Threatening Weight Related Conditions":
  List<Condition> {}

define "All Weight Related Conditions":
  WeightRelatedConditions()

define "Established Cardiovascular Conditions":
  EstablishedCardiovascularDiseases()

define "HFpEF Observations":
  HFpEFObservations()