import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BsModalRef, BsModalService, ModalDirective} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {
  BizRole,
  EntityPagination,
  RoleRatio,
  SplitConfig,
  User,
} from 'src/app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-modal-update-divide',
  templateUrl: './modal-update-divide.component.html',
  styleUrls: ['./modal-update-divide.component.scss'],
})
export class ModalUpdateDivideComponent implements OnInit, OnDestroy {
  @ViewChild('itemModal') itemModal!: ModalDirective;

  public sourceData?: SplitConfig;
  public updateSuccess = new Subject();
  public formGroup!: FormGroup;
  public loading = false;
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
      applyToOnline: [false],
      applyToWorkHours: [false],
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

  get configRatioFormArray(): FormArray {
    return this.roleRatioForm?.get('configRatio') as FormArray;
  }

  patchFormValue(): void {
    if (!this.sourceData) return;

    this.formGroup.patchValue({
      id: this.sourceData.id,
      name: this.sourceData.name,
      applyToOnline: this.sourceData.applyToOnline,
      applyToWorkHours: this.sourceData.applyToWorkHours,
      roleRatios: this.sourceData.roleRatios,
      reassignRoles: this.sourceData.reassignRoles,
    });
  }

  onSubmit(): void {
    console.log('Form Value:', this.formGroup.value);
    // if (this.formGroup.invalid) {
    //   this.commonService.markFormGroupTouched(this.formGroup);
    //   return;
    // }
    // const formValue = this.formGroup.value;
    // this.loading = true;
    // if (formValue.id) {
    //   // Update existing config
    //   this.autoTaskService.splitConfig
    //     .update(formValue.id, formValue)
    //     .pipe(
    //       takeUntil(this.destroy$),
    //       finalize(() => (this.loading = false))
    //     )
    //     .subscribe({
    //       next: (res) => {
    //         if (res.status === 200) {
    //           this.commonService.showSuccess('Cập nhật cấu hình thành công');
    //           this.updateSuccess.next(true);
    //           this.bsModalRef.hide();
    //         }
    //       },
    //     });
    // } else {
    //   // Create new config
    //   delete formValue.id;
    //   this.autoTaskService.splitConfig
    //     .create(formValue)
    //     .pipe(
    //       takeUntil(this.destroy$),
    //       finalize(() => (this.loading = false))
    //     )
    //     .subscribe({
    //       next: (res) => {
    //         if (res.status === 200) {
    //           this.commonService.showSuccess('Tạo cấu hình thành công');
    //           this.updateSuccess.next(true);
    //           this.bsModalRef.hide();
    //         }
    //       },
    //     });
    // }
  }

  editRoleRatio(roleId: string): void {
    this.isOpenBackdrop = true;

    const role = this.roles.rows.find((i) => i.id === roleId);
    if (!role) return;

    this.selectedRole = role;

    let existingRoleRatio = this.formGroup.value.roleRatios?.find(
      (r: RoleRatio) => r.roleId === roleId,
    );

    this.roleRatioForm = this.fb.group({
      roleId: [role.id],
      roleName: [role.name],
      configRatio: this.fb.array([]),
    });

    const roleUsers = this.getUserByRole(roleId);

    const configRatioArray = this.roleRatioForm.get('configRatio') as FormArray;

    while (configRatioArray.length) {
      configRatioArray.removeAt(0);
    }

    roleUsers.forEach((user) => {
      const existingConfig = existingRoleRatio?.configRatio?.find(
        (c: any) => c.userId === user.id,
      );

      configRatioArray.push(
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
      configRatio: formValue.configRatio.filter((c: any) => c.ratio > 0), // Only include users with ratio > 0
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
