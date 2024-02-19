import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateReasonComponent} from './modal-update-reason.component';

describe('ModalUpdateActionComponent', () => {
  let component: ModalUpdateReasonComponent;
  let fixture: ComponentFixture<ModalUpdateReasonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalUpdateReasonComponent],
    });
    fixture = TestBed.createComponent(ModalUpdateReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
