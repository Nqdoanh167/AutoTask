import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  Biz,
  BizRole,
  Branch,
  EntityPagination,
  ITag,
} from '@app/types/viewmodels';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {ToastrService} from 'ngx-toastr';
import {EPerActSetting, EPerActType} from '@app/types/setting';
import {ModifiedUserUnit} from '@app/types/flow';
import {TreeNodeSelectEvent} from 'primeng/tree';
import {NgSelectComponent} from '@ng-select/ng-select';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnDestroy, OnInit {
  @ViewChild('ngSelectTagTask') ngSelectTagTask!: NgSelectComponent;
  public submitted: boolean = false;
  private distanceMinutes = 30;
  public roles: EntityPagination<BizRole> = {
    rows: [],
    loading: false,
    limit: 20,
    query: {},
    page: 1,
    total: 0,
  };
  public tag: EntityPagination<ITag> = {
    rows: [],
    loading: false,
  };
  settingForm!: FormGroup;
  public permission = {
    update: false,
  };
  public workHourError: string = '';

  public branches = this.autoTaskService.getUserUnits(false);
  public selectedBranch: ModifiedUserUnit | null = null;

  public roleBranches: Branch[] = [];
  public userRoles: BizRole[] = [];

  public currentBiz!: Biz;
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
        this.roleBranches = biz.user.roleBranches || [];
      });
    this.permission.update = this.authService.checkUserPer(
      EPerActType.SETTING,
      [EPerActSetting.UPDATE_ROLE_SETTING],
    );
  }

  ngOnInit() {
    this.initial();
    this.getSetting();
    this.getTags();
  }
  initial() {
    this.settingForm = this.fb.group({
      roles: [[]],
      assignRole: [null],
      workHourType: ['fixed_daily'],
      workHours: this.fb.array([]),
      workHourEnable: [false],
      drawAndDropConfig: this.fb.group({
        roleIds: [null],
        drawConfig: this.fb.group({
          maxOpenTasks: [0],
        }),
        dropConfig: this.fb.group({
          transferToBranch: this.fb.group({
            id: [null],
            name: [null],
            department: [null],
            departmentName: [null],
            team: [null],
            teamName: [null],
          }),
          assignedTagIds: [[]],
        }),
        isEnabled: [false],
      }),
    });
    if (!this.permission.update) {
      this.settingForm.disable();
    }

    this.settingForm?.valueChanges.subscribe((value) => {
      this.userRoles =
        (this.currentBiz.user.roles || []).filter(
          (role) => this.settingForm.get('roles')?.value?.includes(role.id),
        ) || [];
    });
  }

  get workHours(): FormArray {
    return this.settingForm.get('workHours') as FormArray;
  }

  get drawAndDropConfig(): FormGroup {
    return this.settingForm.get('drawAndDropConfig') as FormGroup;
  }

  get dropConfig(): FormGroup {
    return this.drawAndDropConfig.get('dropConfig') as FormGroup;
  }

  get drawConfig(): FormGroup {
    return this.drawAndDropConfig.get('drawConfig') as FormGroup;
  }

  get transferToBranch(): any {
    return this.dropConfig?.get('transferToBranch')?.value as any;
  }

  getSetting() {
    this.autoTaskService.currentSetting.subscribe({
      next: (res) => {
        if (res) {
          this.settingForm.patchValue(res);
          if (res.workHours && res.workHours.length > 0) {
            this.workHours.clear();
            res.workHours.forEach((workHour: any) => {
              this.workHours.push(
                this.fb.group({
                  start: this.fb.control(workHour.start),
                  end: this.fb.control(workHour.end),
                }),
              );
            });
          }
        }
      },
    });
  }

  getTimeRange(workHour: any[]): Date[] {
    if (workHour && workHour.length > 0) {
      return [new Date(workHour[0].start), new Date(workHour[0].end)];
    }
    return [];
  }

  getTags() {
    this.autoTaskService.tag
      .get()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tag.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getTagById(id: string) {
    if (id) return this.tag.rows.find((tag: ITag) => tag.id === id);
    return null;
  }

  creatNewTagAndChoose(tag: any) {
    if (tag?.id || !tag?.name) return;
    const body: ITag = {
      name: tag?.name,
      bgColor: '#000000',
    };
    this.autoTaskService.tag
      .create(body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.ngSelectTagTask.filter('');
            this.tag.rows.push(res.data);

            let formTag: string[] = this.dropConfig.value.assignTags || [];
            formTag.push(res.data.id as string);
            //Lọc tag bị undifned
            formTag = formTag.filter((tag) => tag !== undefined);
            this.dropConfig.patchValue({
              assignTags: formTag,
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
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
        this.toasrt.warning(
          `Thời gian làm việc phải ít nhất ${this.distanceMinutes} phút!`,
        );
        this.workHourError = `Thời gian làm việc phải ít nhất ${this.distanceMinutes} phút!`;
        return false;
      }
    }

    return true;
  }

  onSubmit() {
    // Bổ sung required cho roleIds
    const roleIdsControl = this.drawAndDropConfig.get('roleIds');
    if (this.drawAndDropConfig.get('isEnabled')?.value) {
      roleIdsControl?.setValidators([Validators.required]);
    } else {
      roleIdsControl?.clearValidators();
    }
    roleIdsControl?.updateValueAndValidity();

    this.submitted = true;

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
      .pipe(
        take(1),
        finalize(() => (this.submitted = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
            this.autoTaskService.setCurrentSetting(res.data);
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
    const timeRangeString = newRange.map((date) => date.toISOString());

    this.workHours.clear();
    [timeRangeString].forEach((time) => {
      this.workHours.push(
        this.fb.group({
          start: this.fb.control(time[0]),
          end: this.fb.control(time[1]),
        }),
      );
    });
  }

  handleChangeUnit(value: TreeNodeSelectEvent) {
    const node = value.node as ModifiedUserUnit;
  }

  onChangeBranch(items: any) {
    if (items.length >= 1) {
      this.dropConfig.patchValue({
        transferToBranch: {
          id: items[0].id,
          name: items[0].name,
          department: null,
          departmentName: null,
          team: null,
          teamName: null,
        },
      });
    }
    if (items.length >= 2) {
      this.dropConfig.patchValue({
        transferToBranch: {
          ...this.dropConfig.value.transferToBranch,
          department: items[1].id,
          departmentName: items[1].name,
        },
      });
    }
    if (items.length === 3) {
      this.dropConfig.patchValue({
        transferToBranch: {
          ...this.dropConfig.value.transferToBranch,
          team: items[2].id,
          teamName: items[2].name,
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
