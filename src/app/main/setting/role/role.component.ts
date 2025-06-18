import {Component, OnDestroy, OnInit} from '@angular/core';
import {Biz, BizRole, EntityPagination} from '@app/types/viewmodels';
import {Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
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
  private distanceMinutes = 30;
  public roles: EntityPagination<BizRole> = {
    rows: [],
    loading: false,
    limit: 20,
    query: {},
    page: 1,
    total: 0,
  };
  settingForm!: FormGroup;
  public permission = {
    update: false,
  };
  public workHourError: string = '';

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
    this.getSetting();
  }
  initial() {
    this.settingForm = this.fb.group({
      roles: [[]],
      assignRole: [null],
      workHourType: ['fixed_daily'],
      workHours: this.fb.array([]),
      workHourEnable: [true],
    });
    if (!this.permission.update) {
      this.settingForm.disable();
    }
  }

  get workHours(): FormArray {
    return this.settingForm.get('workHours') as FormArray;
  }

  getSetting() {
    this.autoTaskService.currentSetting
      .subscribe({
        next: (res) => {
          if (res) {
            this.settingForm.patchValue(res);
            if(res.workHours && res.workHours.length > 0) {
              this.workHours.clear();
              res.workHours.forEach((workHour: any) => {
                this.workHours.push(this.fb.group({
                  start: this.fb.control(workHour.start),
                  end: this.fb.control(workHour.end),
                }));
              });
            }
        }
        },
      });
  }

  getTimeRange(workHour: any[]): Date[] {
    if(workHour && workHour.length > 0){
      return [new Date(workHour[0].start), new Date(workHour[0].end)];
    }
    return [];
  }

  private validateWorkHours(): boolean {
    if (!this.settingForm.get('workHourEnable')?.value) {
      return true; 
    }

    const workHours = this.settingForm.get('workHours')?.value;
    if (!workHours || workHours.length === 0) {
      this.toasrt.warning('Vui lòng nhập thời gian làm việc!');
      this.workHourError = 'Vui lòng nhập thời gian làm việc!';
      return false;
    }

    for (const workHour of workHours) {
      if (!workHour.start || !workHour.end) {
        this.toasrt.warning('Vui lòng nhập đầy đủ thời gian làm việc!');
        this.workHourError = 'Vui lòng nhập đầy đủ thời gian làm việc!';
        return false;
      }
      const startTime = new Date(workHour.start);
      const endTime = new Date(workHour.end);
      
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      let endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; 
      }
      
      if (endMinutes - startMinutes < this.distanceMinutes) {
        this.toasrt.warning(`Thời gian làm việc phải ít nhất ${this.distanceMinutes} phút!`);
        this.workHourError = `Thời gian làm việc phải ít nhất ${this.distanceMinutes} phút!`;
        return false;
      }
    }

    return true;
  }

  onSubmit() {
    if (this.settingForm.invalid) {
      this.toasrt.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!this.validateWorkHours()) {
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

  onTimeRangeChange(newRange: Date[]) {
    const timeRangeString = newRange.map(date => date.toISOString());

    this.workHours.clear();
    [timeRangeString].forEach(time => {
      this.workHours.push(this.fb.group({
        start: this.fb.control(time[0]),
        end: this.fb.control(time[1]),
      }));
    });
  
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
