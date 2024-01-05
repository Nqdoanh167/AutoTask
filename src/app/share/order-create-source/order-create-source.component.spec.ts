import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCreateSourceComponent } from './order-create-source.component';

describe('OrderCreateSourceComponent', () => {
  let component: OrderCreateSourceComponent;
  let fixture: ComponentFixture<OrderCreateSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderCreateSourceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderCreateSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
