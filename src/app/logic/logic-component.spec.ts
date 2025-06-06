import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogicComponent } from './logic-component';

describe('LogicComponent', () => {
  let component: LogicComponent;
  let fixture: ComponentFixture<LogicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
