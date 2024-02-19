import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateChainActionComponent} from './modal-update-chain-action.component';

describe('ModalUpdateActionComponent', () => {
  let component: ModalUpdateChainActionComponent;
  let fixture: ComponentFixture<ModalUpdateChainActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalUpdateChainActionComponent],
    });
    fixture = TestBed.createComponent(ModalUpdateChainActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
