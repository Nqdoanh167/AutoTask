import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ChainActionComponent} from './chain-action.component';

describe('ChainActionComponent', () => {
  let component: ChainActionComponent;
  let fixture: ComponentFixture<ChainActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChainActionComponent],
    });
    fixture = TestBed.createComponent(ChainActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
