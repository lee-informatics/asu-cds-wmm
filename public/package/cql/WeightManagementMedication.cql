// Clinical decision support logic implementing "Guidance for Managing Scarce Weight Management Medication Resources in VA"
// guidelines document dated May, 2024, as published by U.S. Department of Veterans Affairs.
//
//
// The guidelines require some form of BMI measurement. This is implemented using either:
//
// 1) [Default] Calculated BMI from the most recent weight and height observations, with automatic unit conversions
// 2) [Fallback] The most recently captured explicit, pre-computed BMI observation
//
// If BMI cannot be determined, expression output will return "unknown", null, or empty values.
//
// Author: Preston Lee
//

library WeightManagementMedication version '1.1.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

// These ValueSet resources have been  derived from those provided by the Clinical Architecture team
// providing support for the Symedical terminology infrastructure implemented at VA.
// Expansions of certain value sets are too long to inline into the library, and thus require runtime evaluation.
valueset "CardiovascularDiseases" : 'https://asu.edu/fhir/ValueSet/cardiovascular-diseases'
valueset "DiabetesMellitusType2" : 'https://asu.edu/fhir/ValueSet/diabetes-mellitus-type-2'
valueset "DyslipidemiaAll" : 'https://asu.edu/fhir/ValueSet/dyslipidemia-all'
valueset "HeartFailureWithPreservedEjectionFraction" : 'https://asu.edu/fhir/ValueSet/heart-failure-with-preserved-ejection-fraction'
valueset "HypertensionPrimary" : 'https://asu.edu/fhir/ValueSet/hypertension-primary'
valueset "MetabolicDysfunctionAssociatedSteatoticLiverDisease" : 'https://asu.edu/fhir/ValueSet/metabolic-dysfunction-associated-steatotic-liver-disease'
valueset "MetabolicSyndrome" : 'https://asu.edu/fhir/ValueSet/metabolic-syndrome'
valueset "Osteoarthritis" : 'https://asu.edu/fhir/ValueSet/osteoarthritis'
valueset "SleepApneaObstructive" : 'https://asu.edu/fhir/ValueSet/sleep-apnea-obstructive'
valueset "LifeThreateningWeightRelatedConditions" : 'https://asu.edu/fhir/ValueSet/life-threatening-weight-related-conditions'

// Declarations for inline/hardcoded code references.
codesystem "LOINC" : 'http://loinc.org'
codesystem "SNOMED" : 'http://snomed.info/sct'
codesystem "UCUM": 'http://unitsofmeasure.org'

// HL7 value sets that can be used for additional Condition logic, if needed.
//codesystem "ConditionClinicalStatus": 'http://terminology.hl7.org/CodeSystem/condition-clinical'
//codesystem "ConditionVerificationStatus": 'http://terminology.hl7.org/CodeSystem/condition-ver-status'

code "BMI LOINC" : '39156-5' from "LOINC" display 'Body mass index (BMI) [Ratio]'
code "Body Height" : '8302-2' from "LOINC" display 'Body height'
code "Body Weight" : '29463-7' from "LOINC" display 'Body weight'

// Logic is intended to operate upon a single FHIR Patient subject at a time

context Patient

// Generic BMI-related functions

define function RecordedBodyWeight():
	First([Observation: "Body Weight"] W
    	where W.status in { 'final', 'amended', 'corrected' }
        and W.effective is not null
        and W.value.code in {'kg', '[lb_av]'}
        sort by start of effective desc)

define function RecordedBodyHeight() : 
	First([Observation: "Body Height"] H
    	where H.status in { 'final', 'amended', 'corrected'}
        and H.effective is not null
        and H.value.code in {'m', 'cm', '[in_i]'}
        sort by start of effective desc)

define function RecordedBMI():
  Last([Observation : "BMI LOINC"] O
    where O.status in { 'final', 'amended', 'corrected' }
    and O.effective is not null
    sort by start of effective asc
  )

define function ComputeBMIFromWeightAndHeight() :
	convert (convert RecordedBodyWeight().value to 'kg') / ((convert RecordedBodyHeight().value to 'm') * (convert RecordedBodyHeight().value to 'm')) to 'kg/m2'

// define function TestBMI() :
//	[Observation] O where exists(O.code.coding OC where OC.code ~ 'BAD-CODE')

define function HasBMIOver(bmi System.Quantity):
  UsedBMI > bmi

// Generic BMI range determination.
// Lower boundary is inclusive. Upper boundary is exclusive.
define function HasBMIBetween(low System.Quantity, high System.Quantity):
  UsedBMI >= low and UsedBMI < high

// Queries intended to directly align with the information concepts defined by the clinical guidelines

define function EstablishedCardiovascularDiseases():
  [Condition : "CardiovascularDiseases"] C where exists(C.clinicalStatus.coding CSCode where CSCode.code ~ 'active')

define function WeightRelatedConditions():
  [Condition] C where C.code in "CardiovascularDiseases"
    or C.code in "CardiovascularDiseases"
    or C.code in "DiabetesMellitusType2"
    or C.code in "DyslipidemiaAll"
    or C.code in "HeartFailureWithPreservedEjectionFraction"
    or C.code in "HypertensionPrimary"
    or C.code in "MetabolicDysfunctionAssociatedSteatoticLiverDisease"
    or C.code in "MetabolicSyndrome"
    or C.code in "Osteoarthritis"
    or C.code in "SleepApneaObstructive"
    or C.code in "LifeThreateningWeightRelatedConditions"

define function ActiveLifeThreateningWeightRelatedConditions():
  [Condition: "LifeThreateningWeightRelatedConditions"] C where exists(C.clinicalStatus.coding CSCode where CSCode.code ~ 'active')

// Expressions automatically evaluated for the caller in FHIR Patient context

define HasBMIOver40 :
  HasBMIOver(40.0 'kg/m2')

define HasBMI35To40 :
  HasBMIBetween(35.0 'kg/m2', 40.0 'kg/m2')

define HasBMI30To35 :
  HasBMIBetween(30.0 'kg/m2', 35.0 'kg/m2')

define HasBMI27To30 :
  HasBMIBetween(27.0 'kg/m2', 30.0 'kg/m2')

// Tier determinations as defined by the guidelines.
// Important: Tiering determinations may incorrectly return false if the Patient does not have any BMI records,
// as a specific BMI range is required for most categories.

define HighestTier :
  if IsTier1a then '1a'
  else if IsTier1b then '1b'
  else if IsTier2a then '2a'
  else if IsTier2b then '2b'
  else if IsTier2c then '2c'
  else if IsTier3 then '3'
  else null

define IsTier1a :
  Count(AllLifeThreateningWeightRelatedConditions)> 0

define IsTier1b :
  AgeInYears()>= 45
  and Exists(EstablishedCardiovascularDiseases())
  and(HasBMIOver(27.0 'kg/m2'))

define IsTier2a :
  (Count(AllWeightRelatedConditions)>= 3
    or exists [Condition: "HeartFailureWithPreservedEjectionFraction"]
  )
  and(HasBMIOver(27.0 'kg/m2'))

define IsTier2b :
  Count(AllWeightRelatedConditions)>= 2
  and(HasBMIOver(27.0 'kg/m2'))

define IsTier2c :
  Count(AllWeightRelatedConditions)>= 2
  and(HasBMIOver(27.0 'kg/m2'))

define IsTier3 :
  HasBMIOver(30.0 'kg/m2')

define MostRecentRecordedBodyHeight :
	RecordedBodyHeight()

define MostRecentRecordedBodyWeight :
	RecordedBodyWeight()

define MostRecentRecordedBMI : 
	RecordedBMI().value

define ComputedBMI : 
	ComputeBMIFromWeightAndHeight()


// Uses the most recent explicitly recorded BMI observation if present,
// with fallback to manual calculation based on recorded weight and height.
// If neither are possible from available data, returns null.
define UsedBMI :
	Coalesce(ComputeBMIFromWeightAndHeight(), RecordedBMI().value)
 

// Comment this out if we don't need it.
define AllWeightRelatedConditions:
  WeightRelatedConditions()

define AllLifeThreateningWeightRelatedConditions:
  ActiveLifeThreateningWeightRelatedConditions()
