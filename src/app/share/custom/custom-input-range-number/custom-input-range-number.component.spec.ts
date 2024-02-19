import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CustomInputRangeNumberComponent} from './custom-input-range-number.component';

describe('CustomInputRangeNumberComponent', () => {
  let component: CustomInputRangeNumberComponent;
  let fixture: ComponentFixture<CustomInputRangeNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomInputRangeNumberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomInputRangeNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
