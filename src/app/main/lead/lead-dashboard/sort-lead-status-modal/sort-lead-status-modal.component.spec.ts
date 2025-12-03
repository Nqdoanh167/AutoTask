import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortLeadStatusModalComponent } from './sort-lead-status-modal.component';

describe('SortLeadStatusModalComponent', () => {
  let component: SortLeadStatusModalComponent;
  let fixture: ComponentFixture<SortLeadStatusModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SortLeadStatusModalComponent]
    });
    fixture = TestBed.createComponent(SortLeadStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
