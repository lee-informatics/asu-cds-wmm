// Author: Preston Lee

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { PatientService } from './patient.service';
import { BackendService } from './backend.service';
import { LibraryService } from './library.service';

import { provideHighlightOptions } from 'ngx-highlightjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // provideZonelessChangeDetection(),
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideToastr({ positionClass: 'toast-bottom-right' }),
    provideHighlightOptions({
      fullLibraryLoader: () => import('highlight.js')
    }),
    BackendService,
    LibraryService,
    PatientService
  ]

};
