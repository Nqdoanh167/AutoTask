import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef, ModalDirective} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {
  BizRole,
  EntityPagination,
  RatioByEmployee,
  RoleRatio,
  TaskDistributionConfig,
  User,
} from 'src/app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-modal-update-divide',
  templateUrl: './modal-update-divide.component.html',
  styleUrls: ['./modal-update-divide.component.scss'],
})
export class ModalUpdateDivideComponent implements OnInit, OnDestroy {
  @ViewChild('itemModal') itemModal!: ModalDirective;
  @ViewChild('ngSelect') ngSelect!: NgSelectComponent;
  @Output() addItem: EventEmitter<TaskDistributionConfig> = new EventEmitter();
  @Output() updateItem: EventEmitter<TaskDistributionConfig> =
    new EventEmitter();

  public submitted = false;

  public sourceData?: TaskDistributionConfig;
  public formGroup!: FormGroup;
  public loading = {
    roles: false,
    submit: false,
    modal: false,
  };
  public users!: User[];
  private destroy$ = new Subject();

  public roles: EntityPagination<BizRole> = {
    rows: [],
    loading: false,
    limit: 20,
    query: {},
    page: 1,
    total: 0,
  };

  public usersByRole!: Partial<User>[];
  public selectedUserIds: string[] = [];

  public isOpenBackdrop = false;
  public selectedRole: BizRole | null = null;
  roleRatioForm!: FormGroup;

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.roles.rows = biz.roles || [];
        this.users = biz.users.map((i) => i);
      });
  }

  ngOnInit(): void {
    this.initForm();
    if (this.sourceData) {
      this.patchFormValue();
    }
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      applyForOnlineEmployee: [false],
      isWorkHourBased: [false],
      roleRatios: this.fb.array([]),
      reassignRoles: [null],
    });
  }

  getUserByRole(roleId: string): void {
    this.usersByRole = this.users
      .filter((user) => (user.roleIds || []).includes(roleId))
      .map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        picture: user.picture,
      }));
  }

  get roleRatiosFormArray(): FormArray {
    return this.formGroup.get('roleRatios') as FormArray;
  }

  get ratioByEmployeesArray(): FormArray {
    return this.roleRatioForm?.get('ratioByEmployees') as FormArray;
  }

  getQuantityByRole(roleId: string): number {
    const roleRatio = this.roleRatiosFormArray.controls.find(
      (c: any) => c.value.roleId === roleId,
    )?.value;

    if (roleRatio) {
      return roleRatio.ratioByEmployees.length;
    }

    return 0;
  }

  public  updateSelectedUserIds(): void {
    const allUserIds: string[] = [];
    
    this.roleRatiosFormArray.controls.forEach((roleControl: any) => {
      const roleValue = roleControl.value;
      if (roleValue.ratioByEmployees && Array.isArray(roleValue.ratioByEmployees)) {
        roleValue.ratioByEmployees.forEach((employee: RatioByEmployee) => {
          if (employee.userId && !allUserIds.includes(employee.userId)) {
            allUserIds.push(employee.userId);
          }
        });
      }
    });
    
    this.selectedUserIds = allUserIds;
  }

  patchFormValue(): void {
    if (!this.sourceData) return;

    const roleRatiosFormArray = this.fb.array([]);

    this.roles.rows.forEach((role) => {
      const existingRoleRatio = this.sourceData?.roleRatios?.find(
        (r: RoleRatio) => r.roleId === role.id,
      );

      if (existingRoleRatio) {
        roleRatiosFormArray.push(
          this.fb.control({
            roleId: existingRoleRatio?.roleId,
            roleName: existingRoleRatio?.roleName,
            roleIcon: existingRoleRatio?.roleIcon,
            ratioByEmployees: existingRoleRatio?.ratioByEmployees,
          }),
        );
      }
    });

    this.formGroup.patchValue({
      id: this.sourceData.id,
      name: this.sourceData.name,
      applyForOnlineEmployee: this.sourceData.applyForOnlineEmployee,
      isWorkHourBased: this.sourceData.isWorkHourBased,
      reassignRoles: this.sourceData.reassignRoles,
    });

    this.formGroup.setControl('roleRatios', roleRatiosFormArray);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.formGroup.get(field);
    return (
      !!control &&
      control.invalid &&
      (control.dirty || control.touched || this.submitted)
    );
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.formGroup.valid && !this.loading.submit) {
      this.loading.submit = true;

      const action = this.formGroup.value.id
        ? this.autoTaskService.taskDistributionConfig.update(
            this.formGroup.value.id,
            this.formGroup.value,
          )
        : this.autoTaskService.taskDistributionConfig.create(
            this.formGroup.value,
          );

      action
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading.submit = false;
            this.bsModalRef.hide();
            this.submitted = false;
          }),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              if (this.formGroup.value.id) {
                this.commonService.handleResSuccess('update');
                this.updateItem.emit(res.data);
              } else {
                this.commonService.handleResSuccess('create');
                this.addItem.emit(res.data);
              }
            } else {
              this.commonService.handleResErr(res);
            }
          },
        });
    }
  }

  hasAvailableRoles(): boolean {
    const existingRoleIds = this.roleRatiosFormArray.controls.map(
      (c: any) => c.value.roleId,
    );
    return this.roles.rows.some((role) => !existingRoleIds.includes(role.id));
  }

  addRoleRatio(): void {
    const existingRoleIds = this.roleRatiosFormArray.controls.map(
      (c: any) => c.value.roleId,
    );

    const availableRoles = this.roles.rows.filter(
      (role) => !existingRoleIds.includes(role.id),
    );

    if (availableRoles.length === 0) {
    }

    const roleToAdd = availableRoles[0];

    this.roleRatiosFormArray.push(
      this.fb.control({
        roleId: roleToAdd.id,
        roleName: roleToAdd.name,
        roleIcon: roleToAdd.icon,
        ratioByEmployees: [],
      }),
    );
  }

  deleteRoleRatio(roleRatio: any): void {
    const existingIndex = this.roleRatiosFormArray.controls.findIndex(
      (c: any) => c.value.roleId === roleRatio.roleId,
    );

    if (existingIndex >= 0) {
      this.roleRatiosFormArray.removeAt(existingIndex);
      this.updateSelectedUserIds();
    }
  }

  editRoleRatio(roleId: string): void {
    this.isOpenBackdrop = true;
    this.loading.modal = true;

    this.getUserByRole(roleId);

    const existingRoleRatio = this.roleRatiosFormArray.controls.find(
      (c: any) => c.value.roleId === roleId,
    )?.value;

    if (existingRoleRatio) {
      this.updateSelectedUserIds()
      this.roleRatioForm = this.fb.group({
        roleId: [roleId, Validators.required],
        roleName: [existingRoleRatio.roleName],
        roleIcon: [existingRoleRatio.roleIcon],
        ratioByEmployees: this.fb.array(
          existingRoleRatio.ratioByEmployees.map((ratioByEmployee: any) => {
            const userData = this.users.find(
              (user) => user.id === ratioByEmployee.userId,
            );

            return this.fb.control({
              userId: userData?.id,
              userPicture: userData?.picture,
              userName: userData?.name,
              userPhone: userData?.phone,
              userEmail: userData?.email,
              ratio: ratioByEmployee.ratio || 1,
            });
          }),
        ),
      });

      this.roleRatioForm.valueChanges.subscribe((values) => {
        this.selectedUserIds = values.ratioByEmployees.map(
          (c: RatioByEmployee) => c.userId
        );
      });
    } else {
      this.roleRatioForm = this.fb.group({
        roleId: [roleId, Validators.required],
        roleName: [''],
        roleIcon: [''],
        ratioByEmployees: this.fb.array([]),
      });
    }

    this.itemModal.show();
    this.itemModal.config.backdrop = 'static';

    setTimeout(() => {
      this.loading.modal = false;
    }, 100);

    this.itemModal.onHide.subscribe(() => {
      this.isOpenBackdrop = false;
    });
  }

  saveRoleRatio(): void {
    if (this.roleRatioForm.invalid) return;

    const formValue = this.roleRatioForm.value;

    const roleRatios = this.formGroup.value.roleRatios || [];
    const existingIndex = roleRatios.findIndex(
      (r: RoleRatio) => r.roleId === formValue.roleId,
    );

    const newRoleRatio: RoleRatio = {
      roleId: formValue.roleId,
      roleName: formValue.roleName,
      roleIcon: formValue.roleIcon,
      ratioByEmployees: formValue.ratioByEmployees.filter(
        (c: RatioByEmployee) => c.ratio > 0,
      ),
    };

    if (existingIndex >= 0) {
      this.roleRatiosFormArray.setControl(
        existingIndex,
        this.fb.control(newRoleRatio),
      );
    } else {
      this.roleRatiosFormArray.push(this.fb.control(newRoleRatio));
    }

    this.itemModal.hide();
  }

  handleChooseUser(user: User) {
    if(user){
      const ratioByEmployeesArray = this.ratioByEmployeesArray;
      const existingIndex = ratioByEmployeesArray.controls.findIndex(
        (c: any) => c.userId === user.id,
      );
  
      if (existingIndex >= 0) {
        ratioByEmployeesArray.removeAt(existingIndex);
      } else {
        ratioByEmployeesArray.push(
          this.fb.control({
            userId: user.id,
            userPicture: user.picture,
            userName: user.name,
            userPhone: user.phone,
            userEmail: user.email,
            ratio: 1,
          }),
        );
      }
    }
  }

  handleChangeRatio(ratio: number, control: AbstractControl) {
    control.setValue({
      ...control.value,
      ratio: ratio,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
