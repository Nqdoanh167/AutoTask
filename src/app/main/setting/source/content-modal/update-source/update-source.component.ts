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
import {EDataSourceType, ISourceDto} from '@app/types/setting';
import {User} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {ToastrService} from 'ngx-toastr';
import {SettingService} from '@app/services/api/setting.service';
import {CommonService} from '@app/services/common/common.service';

@Component({
  selector: 'app-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss'],
})
export class UpdateSourceComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
  @Output() updateSuccess = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  private destroy$ = new Subject();

  public submitted = false;
  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    type: EDataSourceType.MANUAL,
    isActive: true,
    parameters: this.fb.array([]),
    counselor: null,
    products: null,
    token: null,
    apiPath: null,
    apiHeaders: null,
    apiBody: null,
  });
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
  protected readonly EDataSourceType = EDataSourceType;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
    private readonly settingService: SettingService,
    private readonly commonService: CommonService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers = biz.users;
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formParameters() {
    return (<FormArray>this.updateForm.get('parameters')) as FormArray;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue(this.sourceData);
      if (this.sourceData.parameters) {
        this.sourceData?.parameters?.forEach((param: any) => {
          this.formParameters().push(
            this.fb.group({
              key: param.key,
              value: param.value,
            }),
          );
        });
      }
    }
    if (!this.sourceData?.id && this.formParameters().length === 0) {
      this.handleAddParameter();
    }
  }

  handleChangeType() {
    this.updateForm.patchValue({
      token: null,
      apiPath: null,
      apiHeaders: null,
      apiBody: null,
      parameters: [],
      counselor: null,
      products: null,
    });
  }

  onDelete() {
    this.deleteEvent.emit(this.sourceData);
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {
    this.loading.submit = true;
    const body = {
      ...this.updateForm.value,
    } as unknown as ISourceDto;
    if (this.sourceData?.id) {
      this.settingService.source
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
      this.settingService.source
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

  handleAddParameter() {
    this.formParameters().push(this.fb.group({key: null, value: null}));
  }

  handleRemoveParameter(index: number) {
    this.formParameters().removeAt(index);
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
