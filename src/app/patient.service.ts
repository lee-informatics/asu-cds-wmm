// Author: Preston Lee

import { Bundle, Patient } from 'fhir/r4';
import { BaseService } from './base.service';
import { Injectable } from '@angular/core';

@Injectable()
export class PatientService extends BaseService {

	public static PATIENT_PATH = '/Patient';

	// constructor(protected backendService: BackendService) { 
	//   super();
	// }

	url(): string {
		return this.backendService.url + PatientService.PATIENT_PATH;
	}

	index() {
		let b = this.http.get<Bundle<Patient>>(this.url(), { headers: this.backendService.headers() });
		return b;
	}

	urlFor(id: string) {
		return this.backendService.url + '/Patient/' + id;
	}

	get(id: string) {
		return this.http.get<Patient>(this.urlFor(id), { headers: this.backendService.headers() });
	}

	post(patient: Patient) {
		return this.http.post<Patient>(this.url(), JSON.stringify(patient), { headers: this.backendService.headers() });
	}

	put(patient: Patient) {
		return this.http.put<Patient>(this.urlFor(patient.id!), JSON.stringify(patient), { headers: this.backendService.headers() });
	}

	delete(patient: Patient) {
		return this.http.delete<Patient>(this.urlFor(patient.id!), { headers: this.backendService.headers() });
	}

	search(text: string) {
		return this.http.get<Bundle<Patient>>(this.url() + '?name:contains=' + text);
	}

	summary(id: string) {
		return this.http.get<Patient>(this.urlFor(id) + '?_summary=true');
	}

}