// Author: Preston Lee

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="alert alert-dismissible fade show mb-2 shadow-sm"
          [class.alert-success]="toast.kind === 'success'"
          [class.alert-danger]="toast.kind === 'error'"
          [class.alert-warning]="toast.kind === 'warning'"
          role="alert"
        >
          @if (toast.title) {
            <strong class="me-1">{{ toast.title }}</strong>
          }
          {{ toast.message }}
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            (click)="toastService.dismiss(toast.id)"
          ></button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 1080;
      max-width: 24rem;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
