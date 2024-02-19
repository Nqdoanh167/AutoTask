import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ReasonComponent} from './reason.component';

describe('ReasonComponent', () => {
  let component: ReasonComponent;
  let fixture: ComponentFixture<ReasonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReasonComponent],
    });
    fixture = TestBed.createComponent(ReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
