import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BsModalRef, BsModalService, ModalDirective} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {
  BizRole,
  EntityPagination,
  RoleRatio,
  TaskDistributionConfig,
  User,
} from 'src/app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';

@Component({
  selector: 'app-modal-update-divide',
  templateUrl: './modal-update-divide.component.html',
  styleUrls: ['./modal-update-divide.component.scss'],
})
export class ModalUpdateDivideComponent implements OnInit, OnDestroy {
  @ViewChild('itemModal') itemModal!: ModalDirective;
  @Output() addItem: EventEmitter<TaskDistributionConfig> = new EventEmitter();
  @Output() updateItem: EventEmitter<TaskDistributionConfig> =
    new EventEmitter();

  public submitted = false;

  public sourceData?: TaskDistributionConfig;
  public formGroup!: FormGroup;
  public loading = {
    roles: false,
    submit: false,
    modal: true,
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

  getUserByRole(roleId: string): User[] {
    return this.users.filter((user) => (user.roleIds || []).includes(roleId));
  }

  get roleRatiosFormArray(): FormArray {
    return this.formGroup.get('roleRatios') as FormArray;
  }

  get ratioByEmployeesArray(): FormArray {
    return this.roleRatioForm?.get('ratioByEmployees') as FormArray;
  }

  patchFormValue(): void {
    if (!this.sourceData) return;

    const roleRatiosFormArray = this.fb.array([]);

    this.roles.rows.forEach((role) => {
      const existingRoleRatio = this.sourceData?.roleRatios?.find(
        (r: RoleRatio) => r.roleId === role.id,
      );

      const roleRatio = existingRoleRatio || {
        roleId: role.id,
        roleName: role.name,
        ratioByEmployees: [],
      };

      roleRatiosFormArray.push(
        this.fb.control({
          roleId: roleRatio.roleId,
          roleName: roleRatio.roleName,
          ratioByEmployees: roleRatio.ratioByEmployees,
        }),
      );
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

  editRoleRatio(roleId: string): void {
    this.isOpenBackdrop = true;
    this.loading.modal = true;

    const role = this.roles.rows.find((i) => i.id === roleId);
    if (!role) return;

    this.selectedRole = role;

    let existingRoleRatio = this.formGroup.value.roleRatios?.find(
      (r: RoleRatio) => r.roleId === roleId,
    );

    this.roleRatioForm = this.fb.group({
      roleId: [role.id],
      roleName: [role.name],
      ratioByEmployees: this.fb.array([]),
    });

    const roleUsers = this.getUserByRole(roleId);

    // this.roleRatiosFormArray.clear();

    roleUsers.forEach((user) => {
      const existingConfig = existingRoleRatio?.ratioByEmployees?.find(
        (c: any) => c.userId === user.id,
      );

      this.ratioByEmployeesArray.push(
        this.fb.group({
          userId: [user.id],
          userName: [user.name],
          userEmail: [user.email],
          userPicture: [user.picture],
          ratio: [existingConfig?.ratio || 1],
        }),
      );
    });

    this.itemModal.show();
    setTimeout(() => {
      this.loading.modal = false;
    }, 500);

    this.itemModal.onHide.subscribe(() => {
      this.isOpenBackdrop = false;
      this.selectedRole = null;
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
      ratioByEmployees: formValue.ratioByEmployees.filter(
        (c: any) => c.ratio > 0,
      ),
    };

    const roleRatiosArray = this.roleRatiosFormArray;

    if (existingIndex >= 0) {
      roleRatiosArray.setControl(existingIndex, this.fb.control(newRoleRatio));
    } else {
      roleRatiosArray.push(this.fb.control(newRoleRatio));
    }

    this.itemModal.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
