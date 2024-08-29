import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PhoneCallPopUpComponent} from './phone-call-pop-up.component';

describe('PhoneCallPopUpComponent', () => {
  let component: PhoneCallPopUpComponent;
  let fixture: ComponentFixture<PhoneCallPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneCallPopUpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneCallPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
