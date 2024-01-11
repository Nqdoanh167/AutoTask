import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UpdateActionInTaskChainComponent} from './update-action-in-task-chain.component';

describe('ModalUpdateTaskComponent', () => {
  let component: UpdateActionInTaskChainComponent;
  let fixture: ComponentFixture<UpdateActionInTaskChainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateActionInTaskChainComponent],
    });
    fixture = TestBed.createComponent(UpdateActionInTaskChainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
