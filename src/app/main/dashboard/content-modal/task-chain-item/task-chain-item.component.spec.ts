import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskChainItemComponent } from './task-chain-item.component';

describe('TaskChainItemComponent', () => {
  let component: TaskChainItemComponent;
  let fixture: ComponentFixture<TaskChainItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TaskChainItemComponent]
    });
    fixture = TestBed.createComponent(TaskChainItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
