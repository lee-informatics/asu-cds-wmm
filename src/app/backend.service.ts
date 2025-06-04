// Author: Preston Lee

import { Injectable } from "@angular/core";
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class BackendService {

	public url: string;

	public static STATUS_PATH: string = '/status';
	public static SESSIONS_PATH: string = '/sessions';

	public static JWT_LAUNCH_KEY: string = 'jwt';
	public static LOCAL_STORAGE_JWT_KEY: string = 'jwt';

	constructor(protected http: HttpClient) {
		// this.configuration = readFileSync(BackendService.CONFIGURATION_PATH).toJSON();
		this.url = (window as any)["WMM_FHIR_BASE_URL"];
	}

	public includeBearerToken: boolean = false;
	public headers(): HttpHeaders {
		var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
		if (this.includeBearerToken) {
			let jwt = localStorage.getItem(BackendService.LOCAL_STORAGE_JWT_KEY);
			if (jwt) {
				headers = headers.set('Authorization', 'Bearer ' + jwt);
			}
		}
		return headers;
	}

	statusUrl(): string {
		return this.url + BackendService.STATUS_PATH;
	}
	sessionsUrl(): string {
		return this.url + BackendService.SESSIONS_PATH;
	}


	// status() {
	// 	let status = this.http.get<Status>(this.statusUrl(), { headers: this.headers(true) }).pipe(map(res => res));
	// 	return status;
	// }


}
