import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {User} from '@app/types/viewmodels';
import {Subject} from 'rxjs';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {AuthService} from '@app/services/api/auth.service';
import {ETabUpdatePermissionsModal} from '@app/types/setting';
import {ETaskChainType} from '@app/types/flow';

@Component({
  selector: 'app-add-edit-permission',
  templateUrl: './add-edit-permission.component.html',
  styleUrls: ['./add-edit-permission.component.scss'],
})
export class AddEditPermissionComponent implements OnInit, OnDestroy {
  @Input() sourceData?: User;
  @Output() updateSuccess = new EventEmitter();

  public tabs = [
    {key: ETabUpdatePermissionsModal.INFORMATION, name: 'Thông tin'},
    {key: ETabUpdatePermissionsModal.EMPLOYEE, name: 'Danh sách nhân viên'},
  ];
  public activeTab: ETabUpdatePermissionsModal =
    ETabUpdatePermissionsModal.INFORMATION;

  public updateForm = this.fb.group({
    name: [null],
    email: [null],
    groups: [null],
    roles: [null],
    branches: [null],
    status: [null],
    isActive: [false],
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
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
      } as any);
    }
  }

  handleUpdate() {}

  hideModal(): void {
    this.modalRef.hide();
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

  protected readonly ETaskChainType = ETaskChainType;
}
