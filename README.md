# ASU CDS for Weight Management Medication

Arizona State University (ASU) clinical decision support (CDS) resources and reference application for qualifying and prioritizing patient access to weight management medication (WMM).

# Developer Setup

Using Docker, Podmain, or other container runtime, run HAPI FHIR (or FHIR R4 resource server of your choice with "CQL with FHIR" support enabled):

```sh
docker run -d --name hapi-r4 -p 8080:8080 -e hapi.fhir.fhir_version=R4 -e spring.main.allow-bean-definition-overriding=true -e hapi.fhir.expunge_enabled=true -e hapi.fhir.allow_multiple_delete=true -e hapi.fhir.bulk_export_enabled=true -e hapi.fhir.bulk_import_enabled=true -e hapi.fhir.enable_index_missing_fields=true -e hapi.fhir.cdshooks.enabled=true -e hapi.fhir.cr.enabled=true  hapiproject/hapi:v8.2.0-1
```



# Development Plan

## Week 1-2: FHIR & CQL Foundations (Focus: Rapid Familiarization)

Activities: Deep dive into Clinical Stakeholders Clinical Practice Guideline [id="2"]. Hands-on exploration of the HAPI FHIR server. Initial CQL syntax and data type learning – focus on retrieving basic patient data elements.
Goal: Establish core competency with FHIR and CQL.

- Accounts set up.
- Commit, push, merge/rebase to git.
  - [GitHub Tutorial](https://docs.github.com/en/get-started/start-your-journey/hello-world)
- VS Code run CQL example
- Create patient

## Week 3-4: Terminology & Initial Query Design

Activities: Mapping key terms to standard vocabularies (SNOMED CT, RxNorm). Designing 2-3 initial CQL queries targeting core clinical scenarios (e.g., identifying patients meeting basic GLP-1 eligibility criteria).
Goal: Produce functional CQL queries based on the guideline.

## Week 5: Clinical Stakeholder Meeting & Query Validation

Activities: 1-hour meeting with Clinical Stakeholders to present initial queries and receive high-level feedback.
Goal: Validate initial query design with Clinical Stakeholder input.

## Week 6: Rapid Prototype Development

Activities: Building a minimal viable product (MVP) – likely a simple Tableau dashboard – using the existing CQL queries.
Goal: Demonstrate CQL functionality in a practical setting.

## Week 7: Prototype Integration & Testing

Activities: Integrating the prototype application with the HAPI FHIR server and conducting thorough testing.
Goal: Ensure the prototype’s functionality aligns with the CQL queries.

## Week 8: Final Refinement & Presentation Preparation

Activities: Refining the prototype based on testing, preparing a short presentation summarizing the CQL queries and prototype.
Goal: Produce a polished presentation for final demonstration.

## Week 9: Final Presentation & Wrap-Up

Activities: Delivering a 30-minute presentation to Clinical Stakeholders showcasing the prototype and the developed CQL queries. Final documentation and handover of the project.
Goal: Formal demonstration of the internship’s work and project handover.



# Contributors

* Preston Lee
* Daniel Mendoza
* Anthony Yanan
* Unnati Agarwal
* Naga Sai
* Siddarth Usulkar
* Ike Obi
* Toshika Talele

# License

Apache 2.0 or as otherwise noted.
