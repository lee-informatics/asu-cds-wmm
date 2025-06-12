// Author: Preston Lee

import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { Bundle, Library, Parameters } from 'fhir/r4';
import { LibraryService } from '../library.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Highlight } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';

@Component({
	selector: 'logic-component',
	imports: [FormsModule, CommonModule, Highlight, HighlightLineNumbers],
	templateUrl: './logic-component.html',
	styleUrl: './logic-component.scss'
})
export class LogicComponent implements OnChanges {


	public library: Library | null = null;

	protected exampleCqlFileUrl = '/cql/WeightManagement.cql';
	protected cql: string | null = null;
	public static DEFAULT_LIBRARY_VERSION = "0.0.0";
	public libraryVersion: string = LogicComponent.DEFAULT_LIBRARY_VERSION;
	public libraryDescription: string = "";

	constructor(
		protected libraryService: LibraryService,
		protected toastrService: ToastrService) {
		this.libraryService.libraryId = (window as any)["WMM_LIBRARY_ID"] || LibraryService.DEFAULT_LIBRARY_ID;
		console.log('LogicComponent initialized with libraryId:', this.libraryService.libraryId);
		this.reloadLibraryFromServer();
		// this.reloadExampleCql();
	}

	ngOnChanges(changes: SimpleChanges) {
		console.log('Changes detected:', changes);
	}

	libraryAsString(): string {
		let s = '';
		if (this.library) {
			s = JSON.stringify(this.library, null, 2);
		}
		return s;
	}

	decodeLibaryData() {
		if (this.library?.name) {
			this.libraryService.libraryId = this.library.name;
		} else {
			this.libraryService.libraryId = LibraryService.DEFAULT_LIBRARY_ID;
		}
		if (this.library?.version) {
			this.libraryVersion = this.library.version;
		} else {
			this.libraryVersion = LogicComponent.DEFAULT_LIBRARY_VERSION;
		}
		if (this.library?.description) {
			this.libraryDescription = this.library.description;
		} else {
			this.libraryDescription = `Logic Library for ${this.libraryService.libraryId}`;
		}
		if (this.library && this.library.content) {
			for (const content of this.library.content) {
				if (content.contentType === 'text/cql' && content.data) {
					try {
						this.cql = atob(content.data); // Decode base64 encoded CQL
					} catch (e) {
						console.error('Error decoding CQL:', e);
						this.toastrService.error('Failed to decode CQL content.', 'CQL Decoding Error');
					}
				}
			}
		}
	}


	reloadLibraryFromServer() {
		this.libraryService.get(this.libraryService.libraryId).subscribe({
			next: (library: Library) => {
				this.library = library;
				this.decodeLibaryData();
				console.log('Library loaded:', library);
				this.toastrService.success(`Library "${this.libraryService.libraryId}" loaded from server!`, 'Library Loaded');
			}, error: (error: any) => {
				this.library = null;
				console.error('Error loading library:', error);
				this.toastrService.error(`The server didn't respond with library for "${this.libraryService.libraryId}". It likely doesn't exist, in which case you should upload one. :)`, 'Logic Library Not Loaded');
			}
		});
	}

	reloadExampleCql() {
		this.libraryService.getExampleCql(this.exampleCqlFileUrl).subscribe({
			next: (cql: string) => {
				this.cql = cql;
				let v = this.extractVersionFromCql(cql);
				if (v) {
					this.libraryVersion = v;
					console.log('Extracted version from CQL:', this.libraryVersion);
					this.toastrService.success(`CQL loaded to editor has not been saved to the server.`, 'Example Loaded into Editor');
				} else {
					this.libraryVersion = LogicComponent.DEFAULT_LIBRARY_VERSION;
					console.warn('No version found in CQL, using default version:', LogicComponent.DEFAULT_LIBRARY_VERSION);
					this.toastrService.warning(`Using default version "${LogicComponent.DEFAULT_LIBRARY_VERSION}". CQL has not been saved to the server.`, 'Example Loaded into Editor');
				}
			}, error: (error: any) => {
				console.error('Error loading example CQL:', error);
				this.toastrService.error(`The server didn't respond with example CQL for "${this.exampleCqlFileUrl}". Please check the URL.`, 'Example CQL Not Loaded');
				this.cql = null;
			}
		});
	}

	extractVersionFromCql(cql: string): string | null {
		// const versionRegex = /^library.+version\s+\'(.*)\'$/
		const versionRegex = /library.*version\s+['"]([^'"]+)['"]/; // Match version in single or double quotes
		const match = cql.match(versionRegex);
		let version = null;
		if (match?.length && match.length >= 2) {
			version = match[1];
		}
		return version;
	}

	saveCql() {
		if (this.cql) {
			let bundle = this.buildFHIRBundle(
				this.libraryService.libraryId,
				this.libraryVersion,
				this.libraryDescription,
				this.cql);
			this.libraryService.put(bundle).subscribe({
				next: (response: any) => {
					console.log('Library saved successfully:', response);
					this.toastrService.success(`Library "${this.libraryService.libraryId}" saved successfully!`, 'Library Saved to Server');
					this.library = response; // Update the local library reference
					// this.reloadLibrary();
				}, error: (error: any) => {
					console.error('Error saving library:', error);
					this.toastrService.error(`Failed to save library "${this.libraryService.libraryId}". Please check the server logs for more details.`, 'Library Save Failed');
				}
			});
		}
	}

	deleteCql() {
		if (this.library) {
			this.libraryService.delete(this.library).subscribe({
				next: (response: any) => {
					console.log('Library deleted successfully:', response);
					this.toastrService.success(`Library "${this.libraryService.libraryId}" deleted successfully!`, 'Library Deleted');
					this.library = null; // Clear the local library reference
					this.decodeLibaryData(); // Reset the decoded data to defaults
				}, error: (error: any) => {
					console.error('Error deleting library:', error);
					this.toastrService.error(`Failed to delete library "${this.libraryService.libraryId}". Please check the server logs for more details.`, 'Library Delete Failed');
				}
			});
		} else {
			this.toastrService.error('No library ID set. Please provide a valid library ID before deleting.', 'Library Delete Error');
		}
	}

	buildFHIRBundle(libraryName: string, version: string, description: string, cql: string) {
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
			url: this.libraryService.urlFor(libraryName),
			content: [
				{
					contentType: 'text/cql',
					data: encoded, // Use base64 encoded CQL
				},
			],
		};
		return libraryResource;
	}

}