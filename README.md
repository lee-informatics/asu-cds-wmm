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

# Docker Compose Setup Guide

## Prerequisites
- Docker installed

## Quick Start with Docker Compose

The easiest way to get started is using Docker Compose, which will set up all required services automatically.

### Step 1: Build the Application (If Changes Were Made)

If you've made any changes to the codebase, build the Docker image first:

```sh
docker buildx build --platform linux/arm64,linux/amd64 -t p3000/asu-cds-wmm:latest .
```

### Step 2: Start the Services

Run the following command to start all services:

```sh
docker-compose up
```

### The Compose Configuration is bellow

Use this [docker-compose.yml](docker-compose.yml) file:

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

## Using the Weight Management Module

Once all services are running, follow these steps to use the WMM:

### 1. Set Up Patient Data
1. Navigate to the **Stack Controller** at [localhost:4204](http://localhost:4204)
2. You'll see patients ready to upload to the HAPI FHIR server
3. The FHIR URL will be set to `http://localhost:8080/fhir`
4. Click the **Load Selected File Sequence** button

### 2. Configure the WMM Logic
1. Go to the **WMM page** at [localhost:4200](http://localhost:4200)
2. Navigate to the **Logic** tab
3. Click **Load CQL Example into editor**
4. Click **Save to server**

### 3. Run Patient Analysis
1. In the patient search box, search for one of these available patients:
   - **Aaron** (primary example)
   - **Dakota**
   - **Dori**
2. Click the **Select** button for your chosen patient
3. Click **Compute Recommendations**
   - *Note: This process may take several seconds to a minute to complete*
4. Review the results in the highlighted table

## Adding Custom Patients

To add your own patient data, update the stack-controller by modifying the repository at: https://github.com/lee-informatics/asu-cds-data/

## Service Endpoints

- **WMM Web Interface**: [localhost:4200](http://localhost:4200)
- **HAPI FHIR Server**: [localhost:8080](http://localhost:8080)
- **Stack Controller**: [localhost:4204](http://localhost:4204)

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
