import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {User} from '@app/types/viewmodels';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-modal-employee-info',
  templateUrl: './modal-employee-info.component.html',
  styleUrls: ['./modal-employee-info.component.scss'],
})
export class ModalEmployeeInfoComponent implements OnDestroy, OnInit {
  @Input() sourceData?: User;
  @Output() updateSuccess = new EventEmitter();

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
  public currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
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

  compareFunction(item: any, selected: any) {
    return item.id === selected.id;
  }

  viewSetting(key: 'groups' | 'roles' | 'branches') {
    const url = `${environment.urlDomain}/${this.currentBiz}/settings/${key}`;
    window.open(url, '_blank');
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
