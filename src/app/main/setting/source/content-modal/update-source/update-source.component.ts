import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {
  EDataSourceType,
  ESourceArgKey,
  ISetting,
  ISource,
  ISourceArgsDto,
  IUpdateSourceDto,
} from '@app/types/setting';
import {Biz, ICommonDataLazy, IQueryBase, User} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {ToastrService} from 'ngx-toastr';
import {CommonService} from '@app/services/common/common.service';
import {uniqBy} from 'lodash';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {socialPlatforms} from '@app/variable';
import {IChainAct} from '@app/types/flow';
import {OverlayListenerOptions, OverlayOptions} from 'primeng/api';

@Component({
  selector: 'app-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss'],
})
export class UpdateSourceComponent implements OnDestroy, OnInit {
  @Input() sourceData?: ISource;
  @Output() updateSuccess = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  private destroy$ = new Subject();
  private currentBiz!: Biz;

  public autoTaskSetting!: ISetting;
  public platformOptions = socialPlatforms;
  public submitted = false;
  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    type: EDataSourceType.MANUAL,
    platform: [null, [Validators.required]],
    platformId: [null],
    picture: [null],
    isActive: true,
    arguments: this.fb.array([]),
    exeCount: null,
    counselorId: null,
    dTask: this.fb.group({
      branch: null,
      teams: this.fb.array([]),
      taskChainIds: null,
    }),
    apiEndpoint: this.fb.group({
      path: null,
      method: null,
    }),
    apiHeaders: this.fb.group({
      token: null,
    }),
    apiBody: null,
  });
  public actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      filter: JSON.stringify({isActive: true}),
    },
    isAllowLoadMore: false,
  };
  public units = this.autoTaskService.getUserUnits();
  public listType = [
    {
      label: 'Thủ công',
      value: EDataSourceType.MANUAL,
    },
    {
      label: 'API',
      value: EDataSourceType.API,
    },
  ];
  public listBizUsers: User[] = [];
  public loading = {
    submit: false,
    data: false,
  };
  public listSourceArgKey = [
    {
      label: 'Họ tên khách hàng',
      value: ESourceArgKey.NAME,
    },
    {
      label: 'Hình ảnh',
      value: ESourceArgKey.PICTURE,
    },
    {
      label: 'Số điện thoại',
      value: ESourceArgKey.PHONE,
    },
    {
      label: 'Email',
      value: ESourceArgKey.EMAIL,
    },
    {
      label: 'Địa chỉ (Số nhà/Đường/Phố)',
      value: ESourceArgKey.ADDRESS,
    },
    {
      label: 'Đường',
      value: ESourceArgKey.STREET,
    },
    {
      label: 'Tỉnh/Thành phố',
      value: ESourceArgKey.PROVINCE_CODE,
    },
    {
      label: 'Quận/Huyện',
      value: ESourceArgKey.DISTRICT_CODE,
    },
    {
      label: 'Phường/Xã',
      value: ESourceArgKey.WARD_CODE,
    },
    {
      label: 'Sản phẩm quan tâm',
      value: ESourceArgKey.PRODUCT_NAME,
    },
    // {
    //   label: 'Nhân viên phụ trách',
    //   value: ESourceArgKey.TEAMS,
    // },
    // {
    //   label: 'Chuỗi hành động',
    //   value: ESourceArgKey.ADD_CHAIN_ACT_IDS,
    // },
    {
      label: 'Tag',
      value: ESourceArgKey.TAGS,
    },
    // {
    //   label: 'Thông tin đơn vị (Chi nhánh/Phòng ban/Nhóm)',
    //   value: ESourceArgKey.BRANCH,
    // },
    {
      label: 'Facebook AD ID',
      value: ESourceArgKey.FB_AD_ID,
    },
    {
      label: 'UTM Campaign',
      value: ESourceArgKey.UTM_CAMPAIGN,
    },
    {
      label: 'UTM Source',
      value: ESourceArgKey.UTM_SOURCE,
    },
    {
      label: 'UTM Medium',
      value: ESourceArgKey.UTM_MEDIUM,
    },
    {
      label: 'UTM Term',
      value: ESourceArgKey.UTM_TERM,
    },
    {
      label: 'UTM Content',
      value: ESourceArgKey.UTM_CONTENT,
    },
  ];

  protected readonly EDataSourceType = EDataSourceType;

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz;
        this.listBizUsers =
          biz.users?.map((user) => {
            return {
              ...user,
              disabled: !user.isActive,
            };
          }) || [];
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formArguments() {
    return (<FormArray>this.updateForm.get('arguments')) as FormArray;
  }

  get formTeams() {
    return <FormArray>this.updateForm.get('dTask.teams');
  }

  checkExistArgKey(argKey: string) {
    return this.formArguments().controls.some(
      (control) => control?.get('argKey')?.value === argKey,
    );
  }

  ngOnInit(): void {
    this.getAutoTaskSetting();
    this.getActionChain();
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
        counselorId: this.sourceData?.counselor?.id,
      } as ISource as any);
      if (this.sourceData?.dTask?.branch) {
        const foundUnit = this.autoTaskService.findUnitFromData(
          this.sourceData?.dTask?.branch,
        );
        this.updateForm.get('dTask.branch')?.setValue(foundUnit as any);
      }
      if (this.sourceData?.arguments) {
        this.sourceData?.arguments?.forEach((argument: ISourceArgsDto) => {
          this.formArguments().push(
            this.fb.group({
              argKey: [argument.argKey, Validators.required],
              argRef: [argument.argRef, Validators.required],
            }),
          );
        });
      }
    }
  }

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.actionChains.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actionChains.rows = uniqBy(
              this.actionChains.rows.concat(res.data),
              'id',
            );
            this.actionChains.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.actionChains.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actionChains.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getAutoTaskSetting() {
    if (!this.currentBiz) return;
    this.autoTaskService.setting
      .retrieve({bizId: this.currentBiz?.id})
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.autoTaskSetting = res.data;
            res.data.roles?.forEach((role) => {
              const findRole = this.currentBiz.roles.find((r) => r.id === role);
              let initTeam = null;
              if (!this.sourceData && findRole?.id === res.data.assignRole) {
                initTeam = {
                  userId: this.currentBiz.user.id,
                  userName: this.currentBiz.user.name,
                  userPicture: this.currentBiz.user.picture,
                  userEmail: this.currentBiz.user.email,
                };
              }

              const findTeam = this.sourceData?.dTask?.teams?.find(
                (team) => team.roleId === role,
              );

              this.formTeams.push(
                this.fb.group({
                  roleId: findRole?.id,
                  roleIcon: findRole?.icon,
                  roleName: findRole?.name,
                  userId: initTeam?.userId || findTeam?.userId || null,
                  userName: initTeam?.userName || findTeam?.userName || null,
                  userPicture:
                    initTeam?.userPicture || findTeam?.userPicture || null,
                  userEmail: initTeam?.userEmail || findTeam?.userEmail || null,
                }),
              );
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleChangeType() {
    this.submitted = false;
    this.formArguments().clear();
    this.updateForm.patchValue({
      arguments: [],
      counselorId: null,
    });
    if (
      this.f['type'].value === EDataSourceType.API &&
      !this.sourceData?.id &&
      this.formArguments().length === 0
    ) {
      this.handleAddArgument();
    }
  }

  onDelete() {
    this.deleteEvent.emit(this.sourceData);
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {
    this.loading.submit = true;
    const branchForm = this.f['dTask']?.value?.branch;
    const body = {
      ...this.updateForm.value,
      dTask: {
        ...this.updateForm.value.dTask,
        branch: !!branchForm
          ? {
              unit: branchForm?.level,
              id: branchForm?.id,
              name: branchForm?.name,
              department: branchForm?.department,
              departmentName: branchForm?.departmentName,
              team: branchForm?.team,
              teamName: branchForm?.teamName,
            }
          : null,
      },
    } as any as IUpdateSourceDto;
    if (this.sourceData?.id) {
      this.autoTaskService.source
        .update(this.sourceData.id, body)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading.submit = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.commonService.handleResSuccess('update');
              this.updateSuccess.emit();
              this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    } else {
      this.autoTaskService.source
        .create(body)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading.submit = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.commonService.handleResSuccess('create');
              this.updateSuccess.emit();
              this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  handleAddArgument() {
    this.formArguments().push(
      this.fb.group({
        argKey: [null, Validators.required],
        argRef: [null, Validators.required],
      }),
    );
  }

  handleRemoveArgument(index: number) {
    this.formArguments().removeAt(index);
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  copyApiHeaders() {
    const token = this.updateForm.get('apiHeaders')?.value?.token;
    this.copyText(`{"authorization": "Bear ${token}"}`);
  }

  copyApiBody() {
    const apiBody = this.updateForm.get('apiBody')?.value;
    this.copyText(JSON.stringify(apiBody));
  }

  onChooseTeam(index: number, user: User) {
    this.formTeams.at(index).patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  onRemoveTeam(index: number) {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }

  handleClickPTree(event: any) {
    this.commonService.handleClickPTree(event);
  }

  getOverlayOptions(): OverlayOptions {
    return {
      listener: (event: Event, options?: OverlayListenerOptions) => {
        if (options?.type === 'scroll') {
          return false;
        }
        return options?.valid;
      },
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
