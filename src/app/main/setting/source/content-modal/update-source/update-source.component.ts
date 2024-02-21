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
import {EDataSourceType} from '@app/types/setting';
import {User} from '@app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {ToastrService} from 'ngx-toastr';

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
    api: this.fb.group({
      url: null,
      method: null,
      headers: null,
      body: null,
    }),
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
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.updateForm.patchValue({
          counselorId: biz.user?.id,
        } as any);
        this.listBizUsers = biz.users;
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formParameters() {
    return (<FormArray>this.updateForm.get('parameters')) as FormArray;
  }

  onDelete() {
    this.deleteEvent.emit();
    this.hideModal();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {}

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  ngOnInit(): void {
    if (this.formParameters().length === 0) {
      this.handleAddParameter();
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
