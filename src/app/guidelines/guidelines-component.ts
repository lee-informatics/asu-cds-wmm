// Author: Preston Lee

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { Bundle, Parameters, Patient } from 'fhir/r4';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, switchMap } from 'rxjs';
import { formatRelativeTime, yearsBetween } from '../date-utils';
import { LibraryService } from '../library.service';
import { PatientService } from '../patient.service';
import { ToastService } from '../toast/toast.service';
import { WmmCqlResults } from './wmm-cql-results';

@Component({
  selector: 'dashboard',
  imports: [DatePipe, FormField],
  templateUrl: './guidelines-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidelinesComponent {
  private readonly patientService = inject(PatientService);
  private readonly libraryService = inject(LibraryService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly now = Date.now();

  protected readonly searchModel = signal({ query: '' });
  protected readonly searchForm = form(this.searchModel);

  protected readonly patientList = signal<Bundle<Patient> | null>(null);
  protected readonly patientSearching = signal(false);
  protected readonly patientSelected = signal<Patient | null>(null);
  protected readonly runningCql = signal(false);
  protected readonly results = signal<WmmCqlResults | null>(null);

  constructor() {
    toObservable(this.searchModel)
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => a.query === b.query),
        switchMap(model => {
          const text = model.query.trim();
          if (!text) {
            this.patientList.set(null);
            this.patientSelected.set(null);
            this.patientSearching.set(false);
            return EMPTY;
          }
          this.patientSearching.set(true);
          return this.patientService.search(text).pipe(
            catchError(error => {
              this.patientSearching.set(false);
              this.toastService.error('Error searching for patients: ' + error.message, 'Search Error');
              this.patientList.set(null);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(bundle => {
        this.patientSearching.set(false);
        this.patientList.set(bundle);
      });
  }

  protected patientAge(birthDate: string | undefined): number {
    return birthDate ? yearsBetween(birthDate) : 0;
  }

  protected relativeTime(isoDate: string | undefined): string {
    return isoDate ? formatRelativeTime(isoDate) : '';
  }

  searchPatients(): void {
    const text = this.searchModel().query.trim();
    if (!text) {
      this.resetSearch();
      return;
    }

    this.patientSearching.set(true);
    this.patientService.search(text).subscribe({
      next: bundle => {
        this.patientSearching.set(false);
        this.patientList.set(bundle);
      },
      error: error => {
        this.patientSearching.set(false);
        this.toastService.error('Error searching for patients: ' + error.message, 'Search Error');
        this.patientList.set(null);
      },
    });
  }

  selectPatientSubject(patient: Patient): void {
    this.patientSelected.set(patient);
  }

  removeSubject(): void {
    this.resetSearch();
  }

  resetSearch(): void {
    this.searchModel.set({ query: '' });
    this.patientList.set(null);
    this.patientSelected.set(null);
    this.patientSearching.set(false);
  }

  rerunCql(): void {
    const libraryId = this.libraryService.libraryId();
    const patient = this.patientSelected();

    if (!libraryId || !patient?.id) {
      this.toastService.error(
        'Library ID is not set. Please provide a valid library ID before running CQL.',
        'CQL Evaluation Error'
      );
      return;
    }

    const params = this.createEvaluateParameters(patient.id);
    this.results.set(null);
    this.runningCql.set(true);

    this.libraryService.evaluate(libraryId, params).subscribe({
      next: (parameters: Parameters) => {
        this.toastService.success(
          `CQL evaluation for "${libraryId}" completed successfully!`,
          'CQL Evaluation Success'
        );
        const newResults = new WmmCqlResults();
        newResults.loadFromParameters(parameters);
        this.results.set(newResults);
      },
      error: () => {
        this.toastService.error(
          `Failed to evaluate CQL for "${libraryId}". Please check the server logs for more details.`,
          'CQL Evaluation Failed'
        );
        this.results.set(null);
      },
      complete: () => {
        this.runningCql.set(false);
      },
    });
  }

  private createEvaluateParameters(patientId: string): Parameters {
    return {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'subject',
          valueString: `Patient/${patientId}`,
        },
      ],
    };
  }
}
