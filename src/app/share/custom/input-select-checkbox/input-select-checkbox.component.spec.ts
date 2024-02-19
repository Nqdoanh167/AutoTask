import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InputSelectCheckboxComponent} from './input-select-checkbox.component';

describe('InputCheckboxComponent', () => {
  let component: InputSelectCheckboxComponent;
  let fixture: ComponentFixture<InputSelectCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputSelectCheckboxComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputSelectCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
