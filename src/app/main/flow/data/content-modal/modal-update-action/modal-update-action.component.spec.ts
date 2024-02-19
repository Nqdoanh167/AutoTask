import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateActionComponent} from './modal-update-action.component';

describe('ModalUpdateActionComponent', () => {
  let component: ModalUpdateActionComponent;
  let fixture: ComponentFixture<ModalUpdateActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalUpdateActionComponent],
    });
    fixture = TestBed.createComponent(ModalUpdateActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
