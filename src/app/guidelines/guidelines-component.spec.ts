import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GuidelinesComponent } from './guidelines-component';
import { PatientService } from '../patient.service';
import { LibraryService } from '../library.service';
import { ToastService } from '../toast/toast.service';

describe('GuidelinesComponent', () => {
  let component: GuidelinesComponent;
  let fixture: ComponentFixture<GuidelinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuidelinesComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: PatientService,
          useValue: {
            search: () => of({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] }),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            libraryId: signal('WeightManagementMedication'),
            evaluate: () => of({
              resourceType: 'Parameters',
              parameter: [
                { name: 'IsTier2b', valueBoolean: true },
                { name: 'HasBMI35To40', valueBoolean: true },
              ],
            }),
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
            warning: jasmine.createSpy('warning'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuidelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders guideline tier highlighting after CQL evaluation', () => {
    component['patientSelected'].set({ resourceType: 'Patient', id: 'patient-1' });
    component.rerunCql();
    fixture.detectChanges();

    const results = component['results']();
    expect(results?.tier2b).toBeTrue();
    expect(results?.tier2bii).toBeTrue();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.table-info').length).toBeGreaterThan(0);
  });
});
