import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CustomTabSetComponent} from './custom-tab-set.component';

describe('CustomTabSetComponent', () => {
  let component: CustomTabSetComponent;
  let fixture: ComponentFixture<CustomTabSetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTabSetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomTabSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
