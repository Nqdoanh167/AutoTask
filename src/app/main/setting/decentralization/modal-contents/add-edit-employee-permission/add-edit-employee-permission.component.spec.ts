import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AddEditEmployeePermissionComponent} from './add-edit-employee-permission.component';

describe('AddEditEmployeePermissionComponent', () => {
  let component: AddEditEmployeePermissionComponent;
  let fixture: ComponentFixture<AddEditEmployeePermissionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddEditEmployeePermissionComponent],
    });
    fixture = TestBed.createComponent(AddEditEmployeePermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
