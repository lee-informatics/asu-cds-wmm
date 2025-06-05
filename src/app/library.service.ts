// Author: Preston Lee

import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Library, Parameters } from 'fhir/r4';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
	providedIn: 'root'
})
export class LibraryService extends BaseService {

	public static readonly LIBRARY_PATH = '/Library';
	public static readonly DEFAULT_LIBRARY_ID = 'WeightManagement';

	public libraryId: string = LibraryService.DEFAULT_LIBRARY_ID;

	// constructor(protected backendService: BackendService) { 
	//   super();
	// }
	// public sort: LibrarySearchField = LibrarySearchField.LastUpdated;
	public order: 'asc' | 'desc' = 'asc';
	public pageSize = 10;
	public offset = 0;

	url(): string {
		return this.backendService.url + LibraryService.LIBRARY_PATH;
	}

	// queryParameters() {
	// 	return `_sort=${this.order == 'asc' ? '' : '-'}${this.sort}` + `&_count=${this.pageSize}&_getpagesoffset=${this.offset}`;
	// }

	// index(): Observable<Bundle<Library>> {
	// 	let b = this.http.get<Bundle<Library>>(this.url() + "?" + this.queryParameters(), { headers: this.backendService.headers() });
	// 	return b;
	// }

	urlFor(id: string) {
		return this.backendService.url + '/Library/' + id;
	}

	get(id: string) {
		return this.http.get<Library>(this.urlFor(id), { headers: this.backendService.headers() });
	}

	getExampleCql(url: string) {
		let headers = new HttpHeaders({ 'Accept': 'text/plain' });
		return this.http.get<string>(url, { headers: headers, responseType: 'text' as 'json' });
	}

	post(Library: Library) {
		return this.http.post<Library>(this.url(), JSON.stringify(Library), { headers: this.backendService.headers() });
	}

	put(Library: Library) {
		return this.http.put<Library>(this.urlFor(Library.id!), JSON.stringify(Library), { headers: this.backendService.headers() });
	}

	delete(Library: Library) {
		return this.http.delete<Library>(this.urlFor(Library.id!), { headers: this.backendService.headers() });
	}

    evaluate(libraryId: string, parameters: Parameters) {
        return this.http.post<Parameters>(this.urlFor(libraryId) + '/$evaluate', JSON.stringify(parameters), { headers: this.backendService.headers() });
    }

}
