// Author: Preston Lee

/**
 * Add Practitioner/Location entries for Synthea conditional match URLs
 * (Type?identifier=system|value) and rewrite those references to urn:uuid
 * placeholders so HAPI transaction import does not search the server (HAPI-1091).
 *
 * Usage: npx tsx scripts/complete-example-bundle-refs.ts
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bundle, BundleEntry, Location, Organization, Practitioner } from 'fhir/r4';

const EXAMPLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/package/examples');

const IDENTIFIER_MATCH = /^([A-Za-z]+)\?identifier=([^|]+)\|(.+)$/;

function uuidFromSeed(seed: string): string {
  const ns = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');
  const hash = createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(seed)]))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function rewriteMatchRefs(value: unknown, matchToFullUrl: Map<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMatchRefs(item, matchToFullUrl));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'reference' && typeof child === 'string' && matchToFullUrl.has(child)) {
        next[key] = matchToFullUrl.get(child);
      } else {
        next[key] = rewriteMatchRefs(child, matchToFullUrl);
      }
    }
    return next;
  }
  return value;
}

function collectMatchRefs(
  value: unknown,
  found: Map<string, { resourceType: string; system: string; value: string; display?: string }>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectMatchRefs(item, found);
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  const obj = value as Record<string, unknown>;
  const ref = obj['reference'];
  if (typeof ref === 'string') {
    const parsed = IDENTIFIER_MATCH.exec(ref);
    if (parsed) {
      const existing = found.get(ref);
      const display = typeof obj['display'] === 'string' ? obj['display'] : undefined;
      if (!existing) {
        found.set(ref, {
          resourceType: parsed[1],
          system: parsed[2],
          value: parsed[3],
          display,
        });
      } else if (!existing.display && display) {
        existing.display = display;
      }
    }
  }
  for (const child of Object.values(obj)) {
    collectMatchRefs(child, found);
  }
}

function practitionerEntry(id: string, system: string, value: string, display?: string): BundleEntry {
  const resource: Practitioner = {
    resourceType: 'Practitioner',
    id,
    identifier: [{ system, value }],
  };
  if (display) {
    resource.name = [{ text: display }];
  }
  return {
    fullUrl: `urn:uuid:${id}`,
    resource,
    request: { method: 'PUT', url: `Practitioner/${id}` },
  };
}

function locationEntry(id: string, system: string, value: string, display?: string): BundleEntry {
  const resource: Location = {
    resourceType: 'Location',
    id,
    identifier: [{ system, value }],
    status: 'active',
  };
  if (display) {
    resource.name = display;
  }
  return {
    fullUrl: `urn:uuid:${id}`,
    resource,
    request: { method: 'PUT', url: `Location/${id}` },
  };
}

function organizationEntry(id: string, system: string, value: string, display?: string): BundleEntry {
  const resource: Organization = {
    resourceType: 'Organization',
    id,
    identifier: [{ system, value }],
    active: true,
  };
  if (display) {
    resource.name = display;
  }
  return {
    fullUrl: `urn:uuid:${id}`,
    resource,
    request: { method: 'PUT', url: `Organization/${id}` },
  };
}

function completeBundle(bundle: Bundle): Bundle {
  const found = new Map<string, { resourceType: string; system: string; value: string; display?: string }>();
  collectMatchRefs(bundle, found);
  if (found.size === 0) {
    return bundle;
  }

  const matchToFullUrl = new Map<string, string>();
  const extra: BundleEntry[] = [];
  for (const [matchUrl, info] of found) {
    const id = uuidFromSeed(`${info.resourceType}|${info.system}|${info.value}`);
    const fullUrl = `urn:uuid:${id}`;
    matchToFullUrl.set(matchUrl, fullUrl);
    if (info.resourceType === 'Practitioner') {
      extra.push(practitionerEntry(id, info.system, info.value, info.display));
    } else if (info.resourceType === 'Location') {
      extra.push(locationEntry(id, info.system, info.value, info.display));
    } else if (info.resourceType === 'Organization') {
      extra.push(organizationEntry(id, info.system, info.value, info.display));
    } else {
      throw new Error(`Unsupported conditional match type ${info.resourceType} in ${matchUrl}`);
    }
  }

  const rewritten = rewriteMatchRefs(bundle, matchToFullUrl) as Bundle;
  const entry = [...(rewritten.entry ?? []), ...extra];
  return { ...rewritten, entry };
}

const files = readdirSync(EXAMPLES_DIR).filter((name) => name.endsWith('.json'));
for (const name of files) {
  const path = join(EXAMPLES_DIR, name);
  const bundle = JSON.parse(readFileSync(path, 'utf8')) as Bundle;
  const next = completeBundle(bundle);
  const added = (next.entry?.length ?? 0) - (bundle.entry?.length ?? 0);
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
  console.log(name, 'added', added, 'supporting entries');
}
