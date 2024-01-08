import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateResultComponent} from './modal-update-result.component';

describe('ModalUpdateActionComponent', () => {
  let component: ModalUpdateResultComponent;
  let fixture: ComponentFixture<ModalUpdateResultComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalUpdateResultComponent],
    });
    fixture = TestBed.createComponent(ModalUpdateResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
