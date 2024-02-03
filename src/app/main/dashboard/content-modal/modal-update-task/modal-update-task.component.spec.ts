import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModalUpdateTaskComponent} from './modal-update-task.component';

describe('ModalUpdateTaskComponent', () => {
  let component: ModalUpdateTaskComponent;
  let fixture: ComponentFixture<ModalUpdateTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalUpdateTaskComponent],
    });
    fixture = TestBed.createComponent(ModalUpdateTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
