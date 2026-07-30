// Author: Preston Lee

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BackendService } from './backend.service';

export abstract class BaseService {
  protected readonly backendService = inject(BackendService);
  protected readonly http = inject(HttpClient);

  formatErrors(errors: { [field: string]: Array<string> }): string[] {
    const formatted: string[] = [];
    for (const [key, msgs] of Object.entries(errors)) {
      msgs.forEach(msg => {
        formatted.push(key + ' ' + msg);
      });
    }
    return formatted;
  }

  formatErrorsHtml(errors: { [field: string]: Array<string> }): string {
    let html = '<ul>';
    for (const e of this.formatErrors(errors)) {
      html += '<li>' + e + '</li>';
    }
    html += '</ul>';
    return html;
  }

  formatErrorsText(errors: { [field: string]: Array<string> }): string {
    return this.formatErrors(errors).join(', ');
  }

  toLowercaseLabel(text: string) {
    const matches = text.toLowerCase().match(/[a-z0-9-]/g);
    if (matches) {
      return matches.join('');
    }
    return '';
  }
}
