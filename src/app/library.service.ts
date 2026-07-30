// Author: Preston Lee

import { Injectable, signal } from '@angular/core';
import { BaseService } from './base.service';
import { Library, Parameters } from 'fhir/r4';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LibraryService extends BaseService {
  public static readonly LIBRARY_PATH = '/Library';
  public static readonly DEFAULT_LIBRARY_ID = 'WeightManagementMedication';

  readonly libraryId = signal(LibraryService.DEFAULT_LIBRARY_ID);

  public order: 'asc' | 'desc' = 'asc';
  public pageSize = 10;
  public offset = 0;

  url(): string {
    return this.backendService.url + LibraryService.LIBRARY_PATH;
  }

  urlFor(id: string) {
    return this.backendService.url + '/Library/' + id;
  }

  get(id: string) {
    return this.http.get<Library>(this.urlFor(id), { headers: this.backendService.headers() });
  }

  getExampleCql(url: string) {
    const headers = new HttpHeaders({ 'Accept': 'text/plain' });
    return this.http.get<string>(url, { headers, responseType: 'text' as 'json' });
  }

  post(library: Library) {
    return this.http.post<Library>(this.url(), JSON.stringify(library), { headers: this.backendService.headers() });
  }

  put(library: Library) {
    return this.http.put<Library>(this.urlFor(library.id!), JSON.stringify(library), { headers: this.backendService.headers() });
  }

  delete(library: Library) {
    return this.http.delete<Library>(this.urlFor(library.id!), { headers: this.backendService.headers() });
  }

  evaluate(libraryId: string, parameters: Parameters) {
    return this.http.post<Parameters>(
      this.urlFor(libraryId) + '/$evaluate',
      JSON.stringify(parameters),
      { headers: this.backendService.headers() }
    );
  }
}
