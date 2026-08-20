// Author: Preston Lee

/**
 * Prune Synthea example Bundles to WMM CQL retrieve-relevant resources:
 * Patient, the most recent height/weight/BMI Observation per LOINC code, and
 * ValueSet-coded Conditions used by WeightManagementMedication tiering logic.
 *
 * Usage: npx tsx scripts/prune-synthetic-examples.ts
 */

import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bundle, BundleEntry, CodeableConcept, Coding, Resource, ValueSet } from 'fhir/r4';

const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/package');
const EXAMPLES_DIR = join(PACKAGE_DIR, 'examples');

const HEIGHT_WEIGHT_BMI = new Set(['8302-2', '29463-7', '39156-5']);
const LOINC = 'http://loinc.org';

function loadValueSetCodes(): Set<string> {
  const codes = new Set<string>();
  for (const name of readdirSync(PACKAGE_DIR)) {
    if (!name.startsWith('ValueSet-') || !name.endsWith('.json')) {
      continue;
    }
    const vs = JSON.parse(readFileSync(join(PACKAGE_DIR, name), 'utf8')) as ValueSet;
    for (const include of vs.compose?.include ?? []) {
      for (const concept of include.concept ?? []) {
        if (include.system && concept.code) {
          codes.add(`${include.system}|${concept.code}`);
        }
      }
    }
  }
  return codes;
}

function collectCodings(concept: CodeableConcept | undefined): Coding[] {
  return concept?.coding ?? [];
}

type VitalObservation = Resource & {
  code?: CodeableConcept;
  component?: Array<{ code?: CodeableConcept }>;
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string; end?: string };
};

function observationLoincCodes(resource: Resource): string[] {
  if (resource.resourceType !== 'Observation') {
    return [];
  }
  const observation = resource as VitalObservation;
  const codings = [
    ...collectCodings(observation.code),
    ...(observation.component ?? []).flatMap((component) => collectCodings(component.code)),
  ];
  return codings
    .filter((coding) => coding.system === LOINC && coding.code && HEIGHT_WEIGHT_BMI.has(coding.code))
    .map((coding) => coding.code as string);
}

function observationEffectiveStart(resource: Resource): string | null {
  const observation = resource as VitalObservation;
  return observation.effectiveDateTime ?? observation.effectivePeriod?.start ?? null;
}

function observationHasKeepCode(resource: Resource): boolean {
  return observationLoincCodes(resource).length > 0;
}

function keepMostRecentVitalObservations(entries: BundleEntry[]): BundleEntry[] {
  const latestByLoinc = new Map<string, { entry: BundleEntry; effective: string }>();

  for (const entry of entries) {
    const resource = entry.resource;
    if (!resource || resource.resourceType !== 'Observation') {
      continue;
    }
    const effective = observationEffectiveStart(resource);
    if (!effective) {
      continue;
    }
    for (const loinc of observationLoincCodes(resource)) {
      const existing = latestByLoinc.get(loinc);
      if (!existing || effective.localeCompare(existing.effective) > 0) {
        latestByLoinc.set(loinc, { entry, effective });
      }
    }
  }

  const keptObservationIds = new Set(
    [...latestByLoinc.values()].map(({ entry }) => entry.resource?.id).filter(Boolean),
  );

  return entries.filter((entry) => {
    const resource = entry.resource;
    if (!resource || resource.resourceType !== 'Observation') {
      return true;
    }
    return resource.id != null && keptObservationIds.has(resource.id);
  });
}

function conditionHasKeepCode(resource: Resource, valueSetCodes: Set<string>): boolean {
  if (resource.resourceType !== 'Condition') {
    return false;
  }
  const condition = resource as Resource & { code?: CodeableConcept };
  return collectCodings(condition.code).some(
    (coding) => coding.system && coding.code && valueSetCodes.has(`${coding.system}|${coding.code}`),
  );
}

function shouldKeep(resource: Resource | undefined, valueSetCodes: Set<string>): boolean {
  if (!resource) {
    return false;
  }
  if (resource.resourceType === 'Patient') {
    return true;
  }
  return observationHasKeepCode(resource) || conditionHasKeepCode(resource, valueSetCodes);
}

function patientIdOf(bundle: Bundle): string {
  const patient = bundle.entry?.find((e) => e.resource?.resourceType === 'Patient')?.resource;
  if (!patient?.id) {
    throw new Error('Bundle has no Patient with an id');
  }
  return patient.id;
}

function knownKeys(entries: BundleEntry[]): { fullUrls: Set<string>; typeIds: Set<string> } {
  const fullUrls = new Set<string>();
  const typeIds = new Set<string>();
  for (const entry of entries) {
    if (entry.fullUrl) {
      fullUrls.add(entry.fullUrl);
    }
    const resource = entry.resource;
    if (resource?.resourceType && resource.id) {
      typeIds.add(`${resource.resourceType}/${resource.id}`);
    }
  }
  return { fullUrls, typeIds };
}

function isUnresolvableRef(ref: string, fullUrls: Set<string>, typeIds: Set<string>): boolean {
  if (ref.includes('?')) {
    return false;
  }
  if (ref.startsWith('urn:uuid:')) {
    return !fullUrls.has(ref);
  }
  const relative = /^([A-Za-z]+)\/([^/?#]+)$/.exec(ref);
  if (relative) {
    return !typeIds.has(`${relative[1]}/${relative[2]}`) && !fullUrls.has(ref);
  }
  return false;
}

function stripUnresolvableRefs(value: unknown, fullUrls: Set<string>, typeIds: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUnresolvableRefs(item, fullUrls, typeIds))
      .filter((item) => item !== undefined);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj['reference'] === 'string' && isUnresolvableRef(obj['reference'], fullUrls, typeIds)) {
    return undefined;
  }
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(obj)) {
    const stripped = stripUnresolvableRefs(child, fullUrls, typeIds);
    if (stripped !== undefined) {
      next[key] = stripped;
    }
  }
  return next;
}

function pruneBundle(bundle: Bundle, valueSetCodes: Set<string>): Bundle {
  const kept = keepMostRecentVitalObservations(
    (bundle.entry ?? []).filter((entry) => shouldKeep(entry.resource, valueSetCodes)),
  );
  const id = patientIdOf({ ...bundle, entry: kept });
  const entry: BundleEntry[] = kept.map((item) => {
    const resource = item.resource as Resource;
    return {
      ...item,
      request: {
        method: 'PUT',
        url: `${resource.resourceType}/${resource.id}`,
      },
    };
  });
  const { fullUrls, typeIds } = knownKeys(entry);
  const rewritten = stripUnresolvableRefs({ ...bundle, id, type: 'transaction', entry }, fullUrls, typeIds) as Bundle;
  return rewritten;
}

const valueSetCodes = loadValueSetCodes();
if (valueSetCodes.size === 0) {
  throw new Error('No ValueSet codes loaded from public/package/ValueSet-*.json');
}

const files = readdirSync(EXAMPLES_DIR).filter((name) => name.endsWith('.json'));
for (const name of files) {
  const path = join(EXAMPLES_DIR, name);
  const bundle = JSON.parse(readFileSync(path, 'utf8')) as Bundle;
  const next = pruneBundle(bundle, valueSetCodes);
  const id = next.id;
  if (!id) {
    throw new Error(`Pruned bundle from ${name} has no id`);
  }
  const dest = join(EXAMPLES_DIR, `Bundle-${id}.json`);
  writeFileSync(dest, `${JSON.stringify(next, null, 2)}\n`);
  if (path !== dest) {
    unlinkSync(path);
  }
  console.log(
    name,
    '->',
    `Bundle-${id}.json`,
    'kept',
    next.entry?.length ?? 0,
    'of',
    bundle.entry?.length ?? 0,
  );
}
