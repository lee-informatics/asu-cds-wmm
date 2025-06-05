#!/usr/bin/env ts-node
// Default command line interface utilities.
// Requires Node APIs.

import fs from 'fs';
import path from 'path';

import { program } from 'commander';
import axios from 'axios';

// import { CliVersion } from '../src/version';
import { Bundle, Parameters } from 'fhir/r4';

let dryRun = false;

const cli = program //.version(CliVersion.VERSION)
    .description('Weight Management Medication CQL and FHIR resources.');

cli.command('convert <filePath> [outputPath]')
    .description('Converts a .cql file to a base64 string')
    .action((filePath, outputPath) => {
        try {
            const content = fs.readFileSync(filePath);
            const base64Content = content.toString('base64');
            if (outputPath) {
                fs.writeFileSync(outputPath, base64Content);
                console.log(`Base64 content written to ${outputPath}`);
            } else {
                console.log(base64Content);
            }
        } catch (error: any) {
            console.error(`Error: ${error.message}`);
        }
    });

cli.command('create-fhir-bundle <filePath> <outputPath> <description> [ipUrl]')
    .description('Creates a FHIR bundle as a JSON file from an input .cql file')
    .action((filePath, outputPath, description, ipUrl = 'http://localhost:8080/fhir/') => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            // Extract library name and version from the content using regex
            const libraryInfo = extractLibraryInfo(content);
            if (!libraryInfo) {
                console.error('Could not extract library name and version from the .cql file.');
                process.exit(1);
            }
            const { libraryName, version } = libraryInfo;

            const base64Content = Buffer.from(content).toString('base64');

            // Build the FHIR bundle JSON
            const fhirBundle = buildFHIRBundle(libraryName, version, description, base64Content, ipUrl);

            // Write the FHIR bundle JSON to outputPath
            fs.writeFileSync(outputPath, JSON.stringify(fhirBundle, null, 2));
            console.log(`FHIR bundle written to ${outputPath}`);
        } catch (error: any) {
            console.error(`Error: ${error.message}`);
        }
    });

cli.command('post-fhir <filePath> <url>')
    .description('Posts a FHIR bundle JSON file to a FHIR server')
    .action(async (filePath, url) => {
        try {
            // Read the FHIR bundle JSON file
            const bundleContent = fs.readFileSync(filePath, 'utf8');
            const bundleJson = JSON.parse(bundleContent);

            // Perform POST request
            const response = await axios.post(url, bundleJson, {
                headers: {
                    'Content-Type': 'application/fhir+json',
                    'Accept': 'application/fhir+json',
                },
            });

            console.log(`Response Status: ${response.status} ${response.statusText}`);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        } catch (error: any) {
            if (error.response) {
                console.error(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`Error: ${error.message}`);
            }
        }
    });

cli.command('create-and-post <filePath> <outputPath> <description> <url>')
    .description('Creates a FHIR bundle from a .cql file and posts it to a specified URL')
    .action(async (filePath, outputPath, description, url) => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            const libraryInfo = extractLibraryInfo(content);
            if (!libraryInfo) {
                console.error('Could not extract library name and version from the .cql file.');
                process.exit(1);
            }
            const { libraryName, version } = libraryInfo;
            const base64Content = Buffer.from(content).toString('base64');

            const baseUrl = url.endsWith('/') ? url : url + '/';
            const fhirBundle = buildFHIRBundle(libraryName, version, description, base64Content, baseUrl);

            fs.writeFileSync(outputPath, JSON.stringify(fhirBundle, null, 2));
            console.log(`FHIR bundle written to ${outputPath}`);

            const response = await axios.post(baseUrl, fhirBundle, {
                headers: {
                    'Content-Type': 'application/fhir+json',
                    'Accept': 'application/fhir+json',
                },
            });

            console.log(`Response Status: ${response.status} ${response.statusText}`);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        } catch (error: any) {
            if (error.response) {
                console.error(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`Error: ${error.message}`);
            }
        }
    });

cli.command('synthea-upload')
    .description('Upload a directory of Synthea-generated FHIR resources to a FHIR URL using Synthea file naming conventions and loading order.')
    .argument('<directory>', 'Directory with Synthea-generate "fhir" resource files')
    .argument('<url>', 'URL of the FHIR server to upload the resources to')
    .option('-d, --dry-run', 'Perform a dry run without uploading any resources')
    .action((directory, fhirUrl, options) => {
        dryRun = options.dryRun;
        if (dryRun) {
            console.log('Dry run enabled. No resources will be uploaded.');
        }
        const sDirectory = safeFilePathFor(directory);
        console.log(`Uploading Synthea-generated FHIR resources from ${sDirectory} to ${fhirUrl}`);
        const files = fs.readdirSync(sDirectory).filter(file => path.extname(file).toLowerCase() === '.json');
        const hospitals: string[] = [];
        const pratitioners: string[] = [];
        const patients: string[] = [];
        files.forEach((file, i) => {
            if (file.startsWith('hospitalInformation')) {
                hospitals.push(file);
            } else if (file.startsWith('practitionerInformation')) {
                pratitioners.push(file);
            } else {
                patients.push(file);
            }
        });
        // const sFiles = files.map((file) => path.join(sDirectory, file));
        uploadResources(hospitals, sDirectory, fhirUrl).then(() => {
            uploadResources(pratitioners, sDirectory, fhirUrl).then(() => {
                uploadResources(patients, sDirectory, fhirUrl).then(() => {
                    console.log('Done');
                });
            });
        });
    });

cli.command('fhir-server-reset')
    .description('Purge all resources from a FHIR server')
    .argument('<fhirBaseUrl>', 'URL of the FHIR server to expunge resources from')
    .option('-i, --implementation <DRIVER>', 'FHIR server driver to use (e.g., "hapi")', 'hapi')
    .action((fhirBaseUrl, options) => {
        console.log(`Purging all resources from FHIR server at ${fhirBaseUrl}`);
        let params: Parameters = {
            "resourceType": "Parameters",
            "parameter": [
                {
                    "name": "expungeEverything",
                    "valueBoolean": true
                }
            ]
        };
        switch (options.implementation) {
            case 'hapi':
                // HAPI FHIR server expects a specific format for expunge
                axios.post(`${fhirBaseUrl}/$expunge`, params, {
                    headers: {
                        'Content-Type': 'application/fhir+json',
                        'Accept': 'application/fhir+json',
                    }
                }).then((response) => {
                    console.log(`[SUCCESS]: ${response.status} ${response.statusText}`);
                }).catch((error) => {
                    if (error.response) {
                        console.error(`[FAILURE]: ${error.response.status} ${error.response.statusText}`);
                        console.error(JSON.stringify(error.response.data, null, 2));
                    } else {
                        console.error(`[ERROR]: ${error.message}`);
                    }
                });
                break;
            default:
                // Other FHIR server implementations may not support expunge
                console.warn(`Cannot purge data for unknown FHIR server implementation: ${options.implementation}`);
        }
    });


cli.command('synthea-to-cql-test-structure')
    .description('Splits Synthea-generated FHIR resource bundles into separate directories for CQL testing')
    .argument('<bundleDirectory>', 'Local arbitrary directory of JSON FHIR Bundle files to use as patient record content. Each Bundle must contain a Patient resource or it will be skipped.')
    .argument('<outputDirectory>', 'Directory in which to write simulator output')
    .option('-d, --dry-run', 'Perform a dry run without modifying any resources')
    .action((bundleDirectory, outputDirectory, options) => {
        dryRun = options.dryRun;
        if (dryRun) {
            console.log('Dry run enabled. No resources will be modified.');
        }
        const sBundleDirectory = safeFilePathFor(bundleDirectory);
        const sOutputDirectory = safeFilePathFor(outputDirectory);
        const dirs = fs.readdirSync(sBundleDirectory);
        for (let i = 0; i < dirs.length; i++) {
            const file = dirs[i];
            if (!file.endsWith('.json')) {
                console.warn(`Ignoring file that does not end in '.json': ${file}`);
            } else {
                const sBundleFile = safeFilePathFor(path.join(bundleDirectory, file));
                const bundle: Bundle = JSON.parse(fs.readFileSync(sBundleFile).toString());
                const patients = bundle.entry?.filter((entry) => entry.resource?.resourceType == 'Patient');
                if (patients && patients.length > 0) {
                    const patient = patients[0].resource;
                    const patientId = patient?.id;
                    if (patientId) {
                        const patientDirectory = path.join(sOutputDirectory, patientId);
                        if (!fs.existsSync(patientDirectory)) {
                            fs.mkdirSync(patientDirectory);
                        }
                        bundle.entry?.forEach((entry) => {
                            const resource = entry.resource;
                            if (resource && resource.resourceType && resource.id) {
                                const resourceDir = path.join(patientDirectory, resource.resourceType);
                                if (dryRun) {
                                    console.log(`Dry run: Would have created directory: ${resourceDir}`);
                                } else if (!fs.existsSync(resourceDir)) {
                                    fs.mkdirSync(resourceDir);
                                }
                                const resourceFile = path.join(resourceDir, `${resource.id}.json`);
                                if (dryRun) {
                                    console.log(`Dry run: Would have written resource to ${resourceFile}`);
                                } else {
                                    fs.writeFileSync(resourceFile, JSON.stringify(resource, null, "\t"));
                                    console.log(`Resource written to ${resourceFile}`);
                                }
                            }
                        });
                    } else {
                        console.warn(`Skipping Bundle for Patient without id: ${file}`);
                    }

                } else {
                    console.warn(`Skipping Bundle with no Patient resource: ${file}`);
                }
            }
        }
    });


async function uploadResources(_paths: string[], directory: string, fhirUrl: string) {
    let next = _paths.shift();
    if (next) {
        await uploadResource(next, directory, fhirUrl);
        if (_paths.length > 0) {
            await uploadResources(_paths, directory, fhirUrl);
        }
    }
}

async function uploadResource(fileName: string, directory: string, fhirUrl: string) {
    const file = path.join(directory, fileName);
    const raw = fs.readFileSync(file).toString();
    const json = JSON.parse(raw) as any;
    if (dryRun) {
        return new Promise<void>((resolve, reject) => {
            console.log(`Dry run: Would have uploaded ${fileName}`);
            resolve();

        });
    } else {
        return axios.post(fhirUrl, json, {
            headers: {
                'Content-Type': 'application/fhir+json',
                'Accept': 'application/fhir+json',
            },
        }).then((response) => {
            console.log(`[SUCCESS]: ${response.status} ${response.statusText}`, file);
            // console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }).catch((error) => {
            if (error.response) {
                console.error(`[FAILURE]: ${error.response.status} ${error.response.statusText}`, file);
                console.error(JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`[ERROR]: ${error.message}`, file);
            }
        });
    }
}

function safeFilePathFor(fileName: string) {
    let safePath = fileName;
    if (!path.isAbsolute(fileName)) {
        safePath = path.join(process.cwd(), fileName);
    }
    // console.debug(`Safe path: ${safePath}`);
    return safePath;
}

function extractLibraryInfo(content: string) {
    const libraryRegex = /^library\s+(\w+)\s+version\s+'([^']+)'/m;
    const match = content.match(libraryRegex);
    if (match) {
        const libraryName = match[1];
        const version = match[2];
        return { libraryName, version };
    } else {
        return null;
    }
}

function buildFHIRBundle(
    libraryName: string,
    version: string,
    description: any,
    base64Content: string,
    baseUrl: string = 'http://localhost:8080/fhir/'
) {
    const libraryResource = {
        resourceType: 'Library',
        id: libraryName,
        url: `${baseUrl}Library/${libraryName}`,
        version: version,
        name: libraryName,
        title: libraryName,
        status: 'active',
        description: description,
        content: [
            {
                contentType: 'text/cql',
                data: base64Content,
            },
        ],
    };

    const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
            {
                fullUrl: `urn: uuid: ${libraryName}`,
                resource: libraryResource,
                request: {
                    method: 'POST',
                    url: `Library/${libraryName}`,
                },
            },
        ],
    };

    return bundle;
}

program.parse(process.argv);
