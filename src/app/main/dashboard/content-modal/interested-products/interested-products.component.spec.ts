import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InterestedProductsComponent} from './interested-products.component';

describe('InterestedProductsComponent', () => {
  let component: InterestedProductsComponent;
  let fixture: ComponentFixture<InterestedProductsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InterestedProductsComponent],
    });
    fixture = TestBed.createComponent(InterestedProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
