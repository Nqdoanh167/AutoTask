import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalEmployeeInfoComponent} from './modal-employee-info.component';

describe('ModalEmployeeInfoComponent', () => {
  let component: ModalEmployeeInfoComponent;
  let fixture: ComponentFixture<ModalEmployeeInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalEmployeeInfoComponent],
    });
    fixture = TestBed.createComponent(ModalEmployeeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
