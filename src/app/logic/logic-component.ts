// Author: Preston Lee

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { form, FormField, required } from '@angular/forms/signals';
import { Library } from 'fhir/r4';
import { Highlight } from 'ngx-highlightjs';
import { LibraryService } from '../library.service';
import { ToastService } from '../toast/toast.service';

interface LibraryEditorModel {
  libraryId: string;
  version: string;
  description: string;
  cql: string;
}

type LogicTab = 'decoded' | 'library';

@Component({
  selector: 'logic-component',
  imports: [FormField, Highlight],
  templateUrl: './logic-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogicComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly toastService = inject(ToastService);

  static readonly DEFAULT_LIBRARY_VERSION = '0.0.0';

  protected readonly exampleCqlFileUrl = '/package/cql/WeightManagementMedication.cql';
  protected readonly activeTab = signal<LogicTab>('decoded');

  private readonly configLibraryId =
    (window as unknown as Record<string, string>)['WMM_LIBRARY_ID'] || LibraryService.DEFAULT_LIBRARY_ID;

  protected readonly editorModel = signal<LibraryEditorModel>({
    libraryId: this.configLibraryId,
    version: LogicComponent.DEFAULT_LIBRARY_VERSION,
    description: '',
    cql: '',
  });

  protected readonly editorForm = form(this.editorModel, (p) => {
    required(p.libraryId, { message: 'Library ID is required' });
    required(p.cql, { message: 'CQL is required' });
  });

  protected readonly fetchLibraryId = signal(this.configLibraryId);

  private readonly libraryResource = httpResource<Library>(() => {
    const id = this.fetchLibraryId();
    return id ? this.libraryService.urlFor(id) : undefined;
  });

  private readonly loadedLibrary = signal<Library | null>(null);

  protected readonly libraryAsString = computed(() => {
    const library = this.loadedLibrary();
    return library ? JSON.stringify(library, null, 2) : '';
  });

  private lastHandledStatus: string | null = null;

  constructor() {
    effect(() => {
      this.libraryService.libraryId.set(this.editorModel().libraryId);
    });

    effect(() => {
      const status = this.libraryResource.status();
      const library = this.libraryResource.value();
      const fetchId = this.fetchLibraryId();

      if (status === this.lastHandledStatus) {
        return;
      }

      if (status === 'resolved' && library) {
        this.lastHandledStatus = status;
        untracked(() => {
          this.loadedLibrary.set(library);
          this.populateEditorFromLibrary(library);
          this.toastService.success(
            `Library "${fetchId}" loaded from server!`,
            'Library Loaded'
          );
        });
      } else if (status === 'error') {
        this.lastHandledStatus = status;
        untracked(() => {
          this.loadedLibrary.set(null);
          this.toastService.error(
            `The server didn't respond with library for "${fetchId}". It likely doesn't exist, in which case you should upload one. :)`,
            'Logic Library Not Loaded'
          );
        });
      }
    });
  }

  setActiveTab(tab: LogicTab): void {
    this.activeTab.set(tab);
  }

  reloadLibraryFromServer(): void {
    const id = this.editorModel().libraryId;
    this.fetchLibraryId.set(id);
    this.lastHandledStatus = null;
    this.libraryResource.reload();
  }

  reloadExampleCql(): void {
    this.libraryService.getExampleCql(this.exampleCqlFileUrl).subscribe({
      next: (cql: string) => {
        const version = this.extractVersionFromCql(cql);
        this.editorModel.update(model => ({
          ...model,
          cql,
          version: version ?? LogicComponent.DEFAULT_LIBRARY_VERSION,
        }));
        if (version) {
          this.toastService.success('CQL loaded to editor has not been saved to the server.', 'Example Loaded into Editor');
        } else {
          this.toastService.warning(
            `Using default version "${LogicComponent.DEFAULT_LIBRARY_VERSION}". CQL has not been saved to the server.`,
            'Example Loaded into Editor'
          );
        }
      },
      error: () => {
        this.editorModel.update(model => ({ ...model, cql: '' }));
        this.toastService.error(
          `The server didn't respond with example CQL for "${this.exampleCqlFileUrl}". Please check the URL.`,
          'Example CQL Not Loaded'
        );
      },
    });
  }

  saveCql(): void {
    const model = this.editorModel();
    if (!model.cql) {
      return;
    }

    const library = this.buildFHIRBundle(model.libraryId, model.version, model.description, model.cql);
    this.libraryService.put(library).subscribe({
      next: (response: Library) => {
        this.toastService.success(`Library "${model.libraryId}" saved successfully!`, 'Library Saved to Server');
        if (response) {
          this.loadedLibrary.set(response);
          this.populateEditorFromLibrary(response);
        }
      },
      error: () => {
        this.toastService.error(
          `Failed to save library "${model.libraryId}". Please check the server logs for more details.`,
          'Library Save Failed'
        );
      },
    });
  }

  deleteCql(): void {
    const library = this.loadedLibrary();
    if (!library) {
      this.toastService.error('No library ID set. Please provide a valid library ID before deleting.', 'Library Delete Error');
      return;
    }

    this.libraryService.delete(library).subscribe({
      next: () => {
        const id = this.editorModel().libraryId;
        this.toastService.success(`Library "${id}" deleted successfully!`, 'Library Deleted');
        this.loadedLibrary.set(null);
        this.resetEditorDefaults();
      },
      error: () => {
        const id = this.editorModel().libraryId;
        this.toastService.error(
          `Failed to delete library "${id}". Please check the server logs for more details.`,
          'Library Delete Failed'
        );
      },
    });
  }

  private populateEditorFromLibrary(library: Library): void {
    const libraryId = library.name ?? LibraryService.DEFAULT_LIBRARY_ID;
    const version = library.version ?? LogicComponent.DEFAULT_LIBRARY_VERSION;
    const description = library.description ?? `Logic Library for ${libraryId}`;
    let cql = this.editorModel().cql;

    if (library.content) {
      for (const content of library.content) {
        if (content.contentType === 'text/cql' && content.data) {
          try {
            cql = atob(content.data);
          } catch {
            this.toastService.error('Failed to decode CQL content.', 'CQL Decoding Error');
          }
        }
      }
    }

    this.editorModel.set({ libraryId, version, description, cql });
  }

  private resetEditorDefaults(): void {
    const libraryId = this.editorModel().libraryId || LibraryService.DEFAULT_LIBRARY_ID;
    this.editorModel.set({
      libraryId,
      version: LogicComponent.DEFAULT_LIBRARY_VERSION,
      description: `Logic Library for ${libraryId}`,
      cql: '',
    });
  }

  private extractVersionFromCql(cql: string): string | null {
    const versionRegex = /library.*version\s+['"]([^'"]+)['"]/;
    const match = cql.match(versionRegex);
    return match?.[1] ?? null;
  }

  private buildFHIRBundle(libraryName: string, version: string, description: string, cql: string): Library {
    const encoded = btoa(cql);
    return {
      resourceType: 'Library',
      type: {},
      id: libraryName,
      version,
      name: libraryName,
      title: libraryName,
      status: 'active',
      description,
      url: this.libraryService.urlFor(libraryName),
      content: [
        {
          contentType: 'text/cql',
          data: encoded,
        },
      ],
    };
  }
}
