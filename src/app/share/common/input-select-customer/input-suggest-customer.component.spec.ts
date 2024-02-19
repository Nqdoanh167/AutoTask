import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InputSuggestCustomerComponent} from './input-suggest-customer.component';

describe('InputSelectCustomerComponent', () => {
  let component: InputSuggestCustomerComponent;
  let fixture: ComponentFixture<InputSuggestCustomerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InputSuggestCustomerComponent],
    });
    fixture = TestBed.createComponent(InputSuggestCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
