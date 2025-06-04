// Author: Preston Lee

import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { Bundle, Library } from 'fhir/r4';
import { LibraryService } from '../library.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'logic-component',
	imports: [FormsModule, CommonModule],
	templateUrl: './logic-component.html',
	styleUrl: './logic-component.scss'
})
export class LogicComponent implements OnChanges {

	public libraryId: string;
	public library: Library | null = null;

	public exampleCqlFileUrl = '/cql/WeightManagement.cql';
	public exampleCql: string | null = null;

	constructor(
		protected libraryService: LibraryService,
		protected toastrService: ToastrService) {
		this.libraryId = (window as any)["WMM_LIBRARY_ID"] || 'UnknownLibraryId';
		console.log('LogicComponent initialized with libraryId:', this.libraryId);
		// this.reloadLibrary();
		this.reloadExampleCql();
	}

	reloadExampleCql() {
		this.libraryService.getExampleCql(this.exampleCqlFileUrl).subscribe({
			next: (cql: string) => {
				this.exampleCql = cql;
				console.log('Example CQL loaded:', cql);
			}, error: (error: any) => {
				console.error('Error loading example CQL:', error);
				this.toastrService.error(`The server didn't respond with example CQL for "${this.exampleCqlFileUrl}". Please check the URL.`, 'Example CQL Not Loaded');
				this.exampleCql = null;
			}
		});
	}

	reloadLibrary() {
		this.libraryService.get(this.libraryId).subscribe({
			next: (library: Library) => {
				this.library = library;
				console.log('Library loaded:', library);
			}, error: (error: any) => {
				console.error('Error loading library:', error);
				this.toastrService.error(`The server didn't respond with library for "${this.libraryId}". It likely doesn't exist, in which case you should upload one. :)`, 'Logic Library Not Loaded');
				this.library = null;
			}
		});
	}

	ngOnChanges(changes: SimpleChanges) {
		console.log('Changes detected:', changes);
	}

	saveCql() {
	}

	buildFHIRBundle(libraryName: string, version: string, description: any, cql: string): Bundle<Library> {
		let encoded = btoa(cql); // Ensure cql is base64 encoded
		const libraryResource: Library = {
			resourceType: 'Library',
			type: {},
			id: libraryName,
			version: version,
			name: libraryName,
			title: libraryName,
			status: 'active',
			description: description,
			content: [
				{
					contentType: 'text/cql',
					data: encoded, // Use base64 encoded CQL
				},
			],
		};

		const bundle: Bundle<Library> = {
			resourceType: 'Bundle',
			type: 'transaction',
			entry: [
				{
					// fullUrl: `urn:uuid: ${libraryName}`,
					resource: libraryResource,
					request: {
						method: 'PUT',
						url: `Library/${libraryName}`,
					},
				},
			],
		};

		return bundle;
	}
}
