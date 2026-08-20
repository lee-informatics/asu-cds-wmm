# ASU CDS for Weight Management Medication

Arizona State University (ASU) clinical decision support (CDS) resources and reference application for qualifying and prioritizing patient access to weight management medication (WMM).

# Developer Setup and Demonstration

Using Docker, Podman, or other container runtime, run HAPI FHIR (or a FHIR R4 resource server of your choice with "CQL with FHIR" support enabled):

```sh
docker run -d --name hapi-r4 -p 8080:8080 \
  -e "hapi.fhir.fhir_version=R4" \
  -e "spring.main.allow-bean-definition-overriding=true" \
  -e "hapi.fhir.expunge_enabled=true" \
  -e "hapi.fhir.allow_multiple_delete=true" \
  -e "hapi.fhir.bulk_export_enabled=true" \
  -e "hapi.fhir.bulk_import_enabled=true" \
  -e "hapi.fhir.enable_index_missing_fields=true" \
  -e "hapi.fhir.cdshooks.enabled=true" \
  -e "hapi.fhir.cr.enabled=true" \
  -e "spring.jpa.properties.hibernate.search.enabled=true" \
  -e "spring.jpa.properties.hibernate.search.backend.type=lucene" \
  -e "spring.jpa.properties.hibernate.search.backend.analysis.configurer=ca.uhn.fhir.jpa.search.HapiHSearchAnalysisConfigurers\$HapiLuceneAnalysisConfigurer" \
  -e "HAPI_FHIR_ALLOW_EXTERNAL_REFERENCES=true" \
  -e "hapi.fhir.cr.cql.terminology.valueset_preexpansion_mode=USE_IF_PRESENT" \
  -e "hapi.fhir.cr.cql.terminology.valueset_expansion_mode=PERFORM_NAIVE_EXPANSION" \
  -e "hapi.fhir.cr.cql.terminology.valueset_membership_mode=USE_EXPANSION" \
  -e "hapi.fhir.cr.cql.terminology.code_lookup_mode=USE_VALIDATE_CODE_OPERATION" \
  -e "hapi.fhir.cr.cql.data.search_parameter_mode=USE_SEARCH_PARAMETERS" \
  -e "hapi.fhir.cr.cql.data.terminology_parameter_mode=FILTER_IN_MEMORY" \
  -e "hapi.fhir.cr.cql.data.profile_mode=DECLARED" \
  -e "hapi.fhir.pre_expand_value_sets=true" \
  -e "hapi.fhir.enable_task_pre_expand_value_sets=true" \
  -e "hapi.fhir.maximum_expansion_size=20000" \
  -e "hapi.fhir.pre_expand_value_sets_max_count=20000" \
  -e "hapi.fhir.pre_expand_value_sets_default_count=20000" \
  hapiproject/hapi:v8.10.0-3
```

Install the FHIR NPM package on that server so `$evaluate` can find the Library and ValueSets, then optionally POST the Synthea patient Bundles under `public/package/examples/`. See [FHIR package](#fhir-package).

Unless you're running the WMM project (this repository) from source, you can run the latest pre-built image with:

```sh
docker run -it --rm -p 4200:80 -e WMM_FHIR_BASE_URL=http://localhost:8080/fhir -e WMM_LIBRARY_ID=WeightManagementMedication --pull always p3000/asu-cds-wmm:latest
```

* Open the WMM application at http://localhost:4200 and click the "Logic" tab.
* Click "Load CQL Example Into Editor" and make any changes as you see fit.
* Click "Save to Server" to encode and upload it to the FHIR server (or rely on the installed FHIR package Library).
* Click the "Guidelines" tab and search for any of the synthetic patients by name, e.g. "Dakota"
* Click "Compute Recommendations" and see the CQL evaluation results applied dynamically to the guidelines tables.

# Set Environment Variables

```sh
# URL of your local FHIR server. For the above:
WMM_FHIR_BASE_URL=http://localhost:8080/fhir

# Name of the CQL libary used within the application. If unsure, use:
WMM_LIBRARY_ID=WeightManagementMedication
```
# Running from Source

```sh
npm i
npm run start
```

# FHIR package

The FHIR NPM package is the tree at `public/package/`. Author CQL in `cql/*.cql`. `npm run generate:fhir-libraries` compiles those sources to ELM with `@cqframework/cql` and writes `Library-*.json` from the ELM library identifier (name and version). Generation fails if the translator reports any errors.

```bash
npm run generate:fhir-libraries   # CQL → ELM → Library-*.json and .index.json
npm run package:fhir              # generate:fhir-libraries, then write the .tgz at the repo root
```

`package:fhir` writes `com.prestonlee.fhir.wmm-<version>.tgz`. `<version>` comes from `public/package/package.json` (keep that in sync with `library WeightManagementMedication version` in `cql/WeightManagementMedication.cql`). Import the `.tgz` with CQL Studio's FHIR package importer, or any FHIR NPM installer.

Canonical ValueSets live under `public/package/ValueSet-*.json`. Example Synthea patients are pruned transaction Bundles under `public/package/examples/`; POST them to the FHIR server if you want sample patients (Aaron, Dakota, Dori, Enoch).

The Logic tab loads the example CQL from `/package/cql/WeightManagementMedication.cql`. Saving from that tab uploads the Library only; ValueSets still need to come from the installed FHIR package.

# Container Images


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

### The Compose Configuration

Use this [docker-compose.yml](docker-compose.yml) file:

```yml
services:
    wmm-web:
        image: p3000/asu-cds-wmm:latest
        ports:
            - "4200:80"
        environment:
            - WMM_FHIR_BASE_URL=http://localhost:8080/fhir
            - WMM_LIBRARY_ID=WeightManagementMedication
    wmm-hapi-fhir:
        image: hapiproject/hapi:v8.10.0-3
        ports:
            - "8080:8080"
        environment:
            hapi.fhir.fhir_version: R4
            spring.main.allow-bean-definition-overriding: "true"
            hapi.fhir.expunge_enabled: "true"
            hapi.fhir.allow_multiple_delete: "true"
            hapi.fhir.bulk_export_enabled: "true"
            hapi.fhir.bulk_import_enabled: "true"
            hapi.fhir.enable_index_missing_fields: "true"
            hapi.fhir.cdshooks.enabled: "true"
            hapi.fhir.cr.enabled: "true"
            spring.jpa.properties.hibernate.search.enabled: "true"
            spring.jpa.properties.hibernate.search.backend.type: lucene
            # Compose treats $ as interpolation; $$ yields a single $ in the container.
            spring.jpa.properties.hibernate.search.backend.analysis.configurer: ca.uhn.fhir.jpa.search.HapiHSearchAnalysisConfigurers$$HapiLuceneAnalysisConfigurer
            HAPI_FHIR_ALLOW_EXTERNAL_REFERENCES: "true"
            hapi.fhir.cr.cql.terminology.valueset_preexpansion_mode: USE_IF_PRESENT
            hapi.fhir.cr.cql.terminology.valueset_expansion_mode: PERFORM_NAIVE_EXPANSION
            hapi.fhir.cr.cql.terminology.valueset_membership_mode: USE_EXPANSION
            hapi.fhir.cr.cql.terminology.code_lookup_mode: USE_VALIDATE_CODE_OPERATION
            hapi.fhir.cr.cql.data.search_parameter_mode: USE_SEARCH_PARAMETERS
            hapi.fhir.cr.cql.data.terminology_parameter_mode: FILTER_IN_MEMORY
            hapi.fhir.cr.cql.data.profile_mode: DECLARED
            hapi.fhir.pre_expand_value_sets: "true"
            hapi.fhir.enable_task_pre_expand_value_sets: "true"
            hapi.fhir.maximum_expansion_size: "20000"
            hapi.fhir.pre_expand_value_sets_max_count: "20000"
            hapi.fhir.pre_expand_value_sets_default_count: "20000"
```

## Using the Weight Management Module

Once all services are running, follow these steps to use the WMM:

### 1. Install the FHIR package and sample patients
1. Build `com.prestonlee.fhir.wmm-<version>.tgz` with `npm run package:fhir` (see [FHIR package](#fhir-package)).
2. Import that tarball onto the HAPI FHIR server with CQL Studio's FHIR package importer, or any FHIR NPM installer.
3. POST the Bundles under `public/package/examples/` to `http://localhost:8080/fhir`.

### 2. Configure the WMM Logic
1. Go to the **WMM page** at [localhost:4200](http://localhost:4200)
2. Navigate to the **Logic** tab
3. Click **Load CQL Example into editor**
4. Click **Save to server** (optional if the package Library is already installed)

### 3. Run Patient Analysis
1. In the patient search box, search for one of these available patients:
   - **Aaron** (primary example)
   - **Dakota**
   - **Dori**
   - **Enoch**
2. Click the **Select** button for your chosen patient
3. Click **Compute Recommendations**
   - *Note: This process may take several seconds to a minute to complete*
4. Review the results in the highlighted table

## Adding Custom Patients

Add additional FHIR Patient transaction Bundles under `public/package/examples/` and POST them to the FHIR server.

## Service Endpoints

- **WMM Web Interface**: [localhost:4200](http://localhost:4200)
- **HAPI FHIR Server**: [localhost:8080](http://localhost:8080)

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
