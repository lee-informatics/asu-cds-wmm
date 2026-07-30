import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LogicComponent } from './logic-component';
import { LibraryService } from '../library.service';
import { ToastService } from '../toast/toast.service';

describe('LogicComponent', () => {
  let component: LogicComponent;
  let fixture: ComponentFixture<LogicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogicComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        {
          provide: LibraryService,
          useValue: {
            libraryId: signal('WeightManagementMedication'),
            urlFor: (id: string) => `/Library/${id}`,
            get: () => of(null),
            getExampleCql: () => of('library Test version "1.0.0"'),
            put: () => of({}),
            delete: () => of({}),
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

    fixture = TestBed.createComponent(LogicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
