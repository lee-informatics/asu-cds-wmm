// Author: Preston Lee

/**
 * Compile CQL to ELM via @cqframework/cql and read library identity from the AST.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CqlCompilerException,
  CqlTranslator,
  LibraryManager,
  ModelManager,
  createLibrarySourceProvider,
  createModelInfoProvider,
  createUcumService,
  stringAsSource,
} from '@cqframework/cql/cql-to-elm';
// @ts-expect-error No type definitions for @lhncbc/ucum-lhc
import * as ucum from '@lhncbc/ucum-lhc';

const FHIR_VERSION = '4.0.1';
const ASSETS_DIR = join(process.cwd(), 'scripts/cql-to-elm');

interface TranslatorAssets {
  systemModelInfo: string;
  fhirModelInfo: string;
  fhirHelpers: string;
}

let translatorAssets: TranslatorAssets | null = null;
let sharedModelManager: ModelManager | null = null;
let sharedUcumService: unknown = null;

interface ElmJsonEmitter {
  toJson(): string;
}

interface ElmVersionedIdentifier {
  id?: string;
  version?: string;
}

interface ElmLibrary {
  identifier?: ElmVersionedIdentifier;
}

interface ElmLibraryWrapper {
  library?: ElmLibrary;
}

export interface ElmLibraryIdentifier {
  id: string;
  version: string;
}

export interface CqlSourceFile {
  fileName: string;
  cql: string;
}

export interface CompiledCqlLibrary {
  fileName: string;
  cql: string;
  name: string;
  version: string;
}

interface TranslationAttempt {
  elmJson: string | null;
  errors: string[];
  identifier: ElmLibraryIdentifier | null;
}

function loadAssets(): TranslatorAssets {
  if (translatorAssets) {
    return translatorAssets;
  }
  translatorAssets = {
    systemModelInfo: readFileSync(join(ASSETS_DIR, 'system-modelinfo.xml'), 'utf8'),
    fhirModelInfo: readFileSync(join(ASSETS_DIR, `fhir-modelinfo-${FHIR_VERSION}.xml`), 'utf8'),
    fhirHelpers: readFileSync(join(ASSETS_DIR, `FHIRHelpers-${FHIR_VERSION}.cql`), 'utf8'),
  };
  return translatorAssets;
}

function sourceKey(id: string, version: string | null | undefined): string {
  return `${id}|${version ?? ''}`;
}

function kotlinList(list: { asJsReadonlyArrayView?: () => unknown[] } | undefined): CqlCompilerException[] {
  const items = list?.asJsReadonlyArrayView?.() ?? [];
  return items.filter((item): item is CqlCompilerException => item != null);
}

function exceptionMessage(exception: CqlCompilerException): string {
  const locator = exception.locator as
    | { startLine?: number; startChar?: number; x8z_1?: number; y8z_1?: number }
    | undefined;
  const line = locator?.startLine ?? locator?.x8z_1;
  const column = locator?.startChar ?? locator?.y8z_1;
  const where = typeof line === 'number' ? ` (${line}:${typeof column === 'number' ? column : 0})` : '';
  return `${exception.message ?? 'Unknown CQL translator error'}${where}`;
}

export function extractElmLibraryIdentifier(elmJson: string): ElmLibraryIdentifier | null {
  let parsed: ElmLibraryWrapper | ElmLibrary;
  try {
    parsed = JSON.parse(elmJson) as ElmLibraryWrapper | ElmLibrary;
  } catch {
    return null;
  }
  const library = 'library' in parsed && parsed.library ? parsed.library : (parsed as ElmLibrary);
  const id = library.identifier?.id?.trim();
  const version = library.identifier?.version?.trim();
  if (!id || !version) {
    return null;
  }
  return { id, version };
}

function getModelManager(): ModelManager {
  if (sharedModelManager) {
    return sharedModelManager;
  }
  const assets = loadAssets();
  const modelManager = new ModelManager(undefined, true);
  const modelInfoProvider = createModelInfoProvider((id, system, version) => {
    if (id === 'System' && !system && !version) {
      return stringAsSource(assets.systemModelInfo);
    }
    if (id === 'FHIR' && !system && version === FHIR_VERSION) {
      return stringAsSource(assets.fhirModelInfo);
    }
    return null;
  });
  modelManager.modelInfoLoader.registerModelInfoProvider(modelInfoProvider, true);
  sharedModelManager = modelManager;
  return modelManager;
}

function getUcumService(): unknown {
  if (sharedUcumService) {
    return sharedUcumService;
  }
  const ucumUtils = ucum.UcumLhcUtils.getInstance();
  sharedUcumService = createUcumService(
    () => {
      throw new Error('Unsupported operation');
    },
    (unit: string) => {
      const result = ucumUtils.validateUnitString(unit);
      return result.status === 'valid' ? null : result.msg[0];
    },
  );
  return sharedUcumService;
}

function createLibraryManager(siblingSources: Map<string, string>): LibraryManager {
  const { fhirHelpers } = loadAssets();
  const libraryManager = new LibraryManager(getModelManager(), undefined, undefined, getUcumService());
  const librarySourceProvider = createLibrarySourceProvider((id, system, version) => {
    if (id === 'FHIRHelpers' && !system && version === FHIR_VERSION) {
      return stringAsSource(fhirHelpers);
    }
    const cached = siblingSources.get(sourceKey(id, version));
    return cached ? stringAsSource(cached) : null;
  });
  libraryManager.librarySourceLoader.registerProvider(librarySourceProvider);
  return libraryManager;
}

function translateCql(cql: string, libraryManager: LibraryManager): TranslationAttempt {
  const translator = CqlTranslator.fromText(cql, libraryManager);
  const errors = kotlinList(translator.errors).map(exceptionMessage);
  let elmJson: string | null = null;
  try {
    elmJson = (translator as unknown as ElmJsonEmitter).toJson();
  } catch {
    elmJson = null;
  }
  return {
    elmJson,
    errors,
    identifier: elmJson ? extractElmLibraryIdentifier(elmJson) : null,
  };
}

export function translateCqlToElm(
  cql: string,
  siblingSources: Map<string, string> = new Map(),
): TranslationAttempt {
  return translateCql(cql, createLibraryManager(siblingSources));
}

export function compilePackageCqlSources(sources: CqlSourceFile[]): CompiledCqlLibrary[] {
  const pass1Manager = createLibraryManager(new Map());
  const pass1 = sources.map((source) => {
    const attempt = translateCql(source.cql, pass1Manager);
    return { source, attempt };
  });

  const siblingSources = new Map<string, string>();
  for (const { source, attempt } of pass1) {
    if (attempt.identifier) {
      siblingSources.set(sourceKey(attempt.identifier.id, attempt.identifier.version), source.cql);
    }
  }

  const pass2Manager = createLibraryManager(siblingSources);
  return pass1.map(({ source, attempt }) => {
    const resolved =
      attempt.errors.length === 0 && attempt.identifier
        ? attempt
        : translateCql(source.cql, pass2Manager);

    if (resolved.errors.length > 0) {
      throw new Error(
        `CQL-to-ELM failed for ${source.fileName}:\n${resolved.errors.map((e) => `  ${e}`).join('\n')}`,
      );
    }
    if (!resolved.identifier) {
      throw new Error(`CQL-to-ELM produced no library identifier for ${source.fileName}`);
    }
    return {
      fileName: source.fileName,
      cql: source.cql,
      name: resolved.identifier.id,
      version: resolved.identifier.version,
    };
  });
}
