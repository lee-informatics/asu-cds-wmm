# ASU CDS for Weight Management Medication

Arizona State University (ASU) clinical decision support (CDS) resources and reference application for qualifying and prioritizing patient access to weight management medication (WMM).

# Developer Setup

Using Docker, Podmain, or other container runtime, run HAPI FHIR (or FHIR R4 resource server of your choice with "CQL with FHIR" support enabled):

```sh
docker run -d --name hapi-r4 -p 8080:8080 -e hapi.fhir.fhir_version=R4 -e spring.main.allow-bean-definition-overriding=true -e hapi.fhir.expunge_enabled=true -e hapi.fhir.allow_multiple_delete=true -e hapi.fhir.bulk_export_enabled=true -e hapi.fhir.bulk_import_enabled=true -e hapi.fhir.enable_index_missing_fields=true -e hapi.fhir.cdshooks.enabled=true -e hapi.fhir.cr.enabled=true  hapiproject/hapi:v8.2.0-1
```
# Set Environment Variables

```sh
# URL of your local FHIR server. For the above:
WMM_FHIR_BASE_URL=http://localhost:8080/fhir

# Name of the CQL libary used within the application. If unsure, use:
WMM_LIBRARY_ID=WeightManagement
```
# Running from Source

```sh
npm i
npm run start
```

# Container Images

To run a precompiled release image:

```sh
docker run -it --rm -p 4200:80 -e WMM_FHIR_BASE_URL=http://localhost:8080/fhir -e WMM_LIBRARY_ID=WeightManagement p3000/asu-cds-wmm:latest
```

Example command to build your own multip-platform image:

```sh
docker buildx build --platform linux/arm64,linux/amd64 -t p3000/asu-cds-wmm:latest .
```


# Docker Compose
The easiest way to get started would to use docker compose.

First if you made any new changes you will need to still build:
```sh
docker buildx build --platform linux/arm64,linux/amd64 -t p3000/asu-cds-wmm:latest .
```
Then run:
```docker-compose up```

```yml
services:
    wmm-web:
        image: p3000/asu-cds-wmm:latest
        ports:
            - "4200:80"
        environment:
            - WMM_FHIR_BASE_URL=http://localhost:8080/fhir
            - WMM_LIBRARY_ID=WeightManagement
    wmm-hapi-fhir:
        image: hapiproject/hapi:v8.2.0-1
        ports:
            - "8080:8080"
        environment:
            - hapi.fhir.fhir_version=R4
            - spring.main.allow-bean-definition-overriding=true
            - hapi.fhir.expunge_enabled=true
            - hapi.fhir.allow_multiple_delete=true
            - hapi.fhir.bulk_export_enabled=true
            - hapi.fhir.bulk_import_enabled=true
            - hapi.fhir.enable_index_missing_fields=true
            - hapi.fhir.cdshooks.enabled=true
            - hapi.fhir.cr.enabled=true
    stack-controller:
        image: p3000/asu-cds-data:latest
        ports:
          - "4204:80"
```

After runninng that you will have your own build ready.

Steps to use the WMM.
1) Open the stack controller:
   1) Go to localhost:4204
2) You will see patients ready to upload the hapi fhir server and the FHIR URL it will be sent to http://localhost:8080/fhir
3) Press the **Load Selected File Sequence** button
4) Go to WMM page at localhost:4200
5) Go to the logic tab
6) Load CQL Example into editor
7) Save to server
8) Search for Aaron in the patient name search box
   1) Other options are 
      1) Dakota
      2) Dori
   2) You can add you own patient by updating the stack-controller
      1) https://github.com/lee-informatics/asu-cds-data/
9) Press Run
10) Review



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
