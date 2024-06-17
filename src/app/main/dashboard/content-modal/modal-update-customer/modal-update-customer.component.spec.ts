import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateCustomerComponent} from './modal-update-customer.component';

describe('ModalUpdateCustomerComponent', () => {
  let component: ModalUpdateCustomerComponent;
  let fixture: ComponentFixture<ModalUpdateCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUpdateCustomerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalUpdateCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
