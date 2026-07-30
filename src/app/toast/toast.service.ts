// Author: Preston Lee

import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  success(message: string, title = ''): void {
    this.show('success', title, message);
  }

  error(message: string, title = ''): void {
    this.show('error', title, message);
  }

  warning(message: string, title = ''): void {
    this.show('warning', title, message);
  }

  dismiss(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private show(kind: ToastKind, title: string, message: string): void {
    const id = this.nextId++;
    this.toasts.update(toasts => [...toasts, { id, kind, title, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
