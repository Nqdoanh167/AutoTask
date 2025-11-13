import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {ERole, ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '@app/services/api/auth.service';
import {
  CombinedUserAcl,
  Permission,
  UpdateUserAclDto,
  UserAclBranch,
  UserAclDepartment,
  UserAclTeam,
} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import pick from 'lodash/pick';

@Component({
  selector: 'app-modal-employee-info',
  templateUrl: './modal-employee-info.component.html',
  styleUrls: ['./modal-employee-info.component.scss'],
})
export class ModalEmployeeInfoComponent implements OnDestroy, OnInit {
  @Input({required: true}) sourceData!: CombinedUserAcl;
  @Input() permissions!: Permission[]
  @Output() updateSuccess = new EventEmitter();

  public updateForm = this.fb.group({
    userId: [null],
    name: [null],
    email: [null],
    groups: [null],
    roles: [null],
    branches: [null],
    branchIds: [null],
    status: [null],
    isActive: [false],
  });
  public submitted = false;
  public loading = {
    submit: false,
    data: false,
  };
  public currentBiz = '';

  private destroy$ = new Subject();

  protected readonly ERole = ERole;

  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz.alias || '';
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
        userId: this.sourceData?.id,
        isActive: this.sourceData?.isActiveAcl,
        branches: this.sourceData?.aclBranches?.map((branch) => {
          return {
            ...branch,
            departments: branch.departments?.map((department) => {
              if (branch.permission && branch.role === 'OWNER') {
                department.permission = branch.permission;
              }
              return {
                ...department,
                teams: department.teams?.map((team) => {
                  if (department.permission && department.role === 'OWNER') {
                    team.permission = department.permission;
                  }
                  return {...team};
                }),
              };
            }),
          };
        }),
      } as any);
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const data = pick(
      this.updateForm.value,
      'userId',
      'branches',
      'isActive',
    ) as any as UpdateUserAclDto;
    this.autoTaskService.userAcl
      .upsert(data)
      .pipe(
        finalize(() => (this.loading.submit = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.updateSuccess.emit(res.data);
          this.commonService.handleResSuccess('update');
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  compareFunction(item: any, selected: any) {
    return item.id === selected.id;
  }

  viewSetting(key: 'groups' | 'roles' | 'branches') {
    const url = `${environment.urlDomain}/${this.currentBiz}/settings/${key}`;
    window.open(url, '_blank');
  }

  handleChangePermission(
    data: Permission,
    team?: UserAclTeam,
    department?: UserAclDepartment,
    branch?: UserAclBranch,
  ) {
    if (team?.id) {
      team.permission = data?.id ?? null;
    } else if (department?.id) {
      department.permission = data?.id ?? null;
      if (department.role === 'OWNER') {
        department.teams?.forEach((team) => {
          team.permission = data?.id ?? null;
        });
      }
    } else if (branch?.id) {
      branch.permission = data?.id ?? null;
      if (branch.role === 'OWNER') {
        branch.departments?.forEach((department) => {
          department.permission = data?.id ?? null;
          department.teams?.forEach((team) => {
            team.permission = data?.id ?? null;
          });
        });
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
