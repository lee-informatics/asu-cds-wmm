// Author: Preston Lee

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class BackendService {
  public static STATUS_PATH = '/status';
  public static SESSIONS_PATH = '/sessions';
  public static JWT_LAUNCH_KEY = 'jwt';
  public static LOCAL_STORAGE_JWT_KEY = 'jwt';

  public readonly url: string;
  public includeBearerToken = false;

  protected readonly http = inject(HttpClient);

  constructor() {
    this.url = (window as unknown as Record<string, string>)['WMM_FHIR_BASE_URL'];
  }

  headers(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
    if (this.includeBearerToken) {
      const jwt = localStorage.getItem(BackendService.LOCAL_STORAGE_JWT_KEY);
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
}
