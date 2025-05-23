import {Component, OnDestroy, OnInit} from '@angular/core';
import {Biz, BizRole, EntityPagination} from '@app/types/viewmodels';
import {Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {ToastrService} from 'ngx-toastr';
import {EPerActSetting, EPerActType} from '@app/types/setting';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnDestroy, OnInit {
  public roles: EntityPagination<BizRole> = {
    rows: [],
    loading: false,
    limit: 20,
    query: {},
    page: 1,
    total: 0,
  };
  settingForm!: FormGroup;
  workHoursForm!: FormGroup;
  public permission = {
    update: false,
  };

  private currentBiz!: Biz;
  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly fb: FormBuilder,
    private readonly commonService: CommonService,
    private readonly toasrt: ToastrService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz || '';
        this.roles.rows = biz.roles || [];
      });
    this.permission.update = this.authService.checkUserPer(
      EPerActType.SETTING,
      [EPerActSetting.UPDATE_ROLE_SETTING],
    );
  }

  ngOnInit() {
    this.initial();
  }
  initial() {
    this.settingForm = this.fb.group({
      roles: [[]],
      assignRole: [null],
    });
    this.workHoursForm = this.fb.group({
      workHoursType: ['daily'],
      startTime: ['9:41 AM'],
      endTime: ['9:41 AM'],
      isActive: [true],
    });
    if (!this.permission.update) {
      this.settingForm.disable();
    }
    this.getSetting();
  }
  getSetting() {
    this.autoTaskService.setting
      .retrieve({bizId: this.currentBiz.id})
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.settingForm.patchValue(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }
  onsubmit() {
    if (this.settingForm.invalid) {
      this.toasrt.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    this.autoTaskService.setting
      .update({
        ...this.settingForm.value,
      })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  saveWorkHours() {
    if (this.workHoursForm.invalid) {
      return;
    }

    const formValue = this.workHoursForm.value;
    // Call your API service to save work hours
    // this.settingService.saveWorkHours(formValue).subscribe(...);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
