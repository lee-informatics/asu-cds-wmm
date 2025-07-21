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

Use this [docker-compose.yml](https://github.com/lee-informatics/asu-cds-wmm/blob/master/docker-compose.yml) file:

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
