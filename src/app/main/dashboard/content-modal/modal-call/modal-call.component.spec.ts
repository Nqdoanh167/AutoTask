import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalCallComponent} from './modal-call.component';

describe('ModalCallComponent', () => {
  let component: ModalCallComponent;
  let fixture: ComponentFixture<ModalCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalCallComponent],
    });
    fixture = TestBed.createComponent(ModalCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
