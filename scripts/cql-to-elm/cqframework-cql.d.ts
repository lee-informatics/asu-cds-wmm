// Author: Preston Lee
// @cqframework/cql subpath exports have no types entry (cqframework/clinical_quality_language#1768).

declare module '@cqframework/cql/cql-to-elm' {
  export class ModelManager {
    constructor(
      namespaceManager?: unknown,
      enableDefaultModelInfoLoading?: boolean,
      path?: unknown,
      globalCache?: unknown,
    );
    modelInfoLoader: {
      registerModelInfoProvider: (provider: unknown, priority?: boolean) => void;
    };
  }

  export class LibraryManager {
    constructor(
      modelManager: ModelManager,
      cqlCompilerOptions?: unknown,
      libraryCache?: unknown,
      lazyUcumService?: unknown,
      elmLibraryReaderProvider?: unknown,
    );
    librarySourceLoader: {
      registerProvider: (provider: unknown) => void;
    };
  }

  export class CqlTranslator {
    static fromText(cqlText: string, libraryManager: LibraryManager): CqlTranslator;
    toXml(): string;
    errors?: { asJsReadonlyArrayView(): unknown[] };
    warnings?: { asJsReadonlyArrayView(): unknown[] };
    messages?: { asJsReadonlyArrayView(): unknown[] };
  }

  export class CqlCompilerException {
    message?: string;
    locator?: {
      startLine?: number;
      startChar?: number;
      x8z_1?: number;
      y8z_1?: number;
    };
  }

  export function createModelInfoProvider(
    getModelInfoXml: (
      id: string,
      system: string | null | undefined,
      version: string | null | undefined,
    ) => unknown,
  ): unknown;
  export function createLibrarySourceProvider(
    getLibraryCql: (
      id: string,
      system: string | null | undefined,
      version: string | null | undefined,
    ) => unknown,
  ): unknown;
  export function createUcumService(
    convertUnit: (value: string, fromUnit: string, toUnit: string) => string,
    validateUnit: (unit: string) => string | null,
  ): unknown;
  export function stringAsSource(str: string): unknown;
}
