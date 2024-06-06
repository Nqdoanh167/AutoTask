import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '@app/services/api/auth.service';
import {
  ETabUpdatePermissionsModal,
  Permission,
  PermissionDto,
} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-add-edit-permission',
  templateUrl: './add-edit-permission.component.html',
  styleUrls: ['./add-edit-permission.component.scss'],
})
export class AddEditPermissionComponent implements OnInit, OnDestroy {
  @Input() sourceData?: Permission;
  @Output() successEvent = new EventEmitter();

  public tabs = [
    {key: ETabUpdatePermissionsModal.INFORMATION, name: 'Thông tin'},
    {key: ETabUpdatePermissionsModal.EMPLOYEE, name: 'Danh sách nhân viên'},
  ];
  public activeTab: ETabUpdatePermissionsModal =
    ETabUpdatePermissionsModal.INFORMATION;

  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    isActive: [false],
    description: [null],
    permissionAction: this.fb.group({
      task: [],
      flow: [],
      setting: [],
    }),
  });

  public submitted = false;
  public loading = {
    submit: false,
    data: false,
  };

  protected readonly ETabUpdatePermissionsModal = ETabUpdatePermissionsModal;

  private destroy$ = new Subject();

  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
      } as Permission as any);
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {
    this.loading.submit = true;
    const data = this.updateForm.value as unknown as PermissionDto;
    if (this.sourceData) {
      this.autoTaskService.permission
        .update(this.sourceData.id, data)
        .pipe(
          finalize(() => (this.loading.submit = false)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          this.successEvent.emit();
        });
    } else {
      this.autoTaskService.permission
        .create(data)
        .pipe(
          finalize(() => (this.loading.submit = false)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          this.successEvent.emit();
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  selectTab(tab: ETabUpdatePermissionsModal) {
    this.activeTab = tab;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
