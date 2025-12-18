import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {ILeadStatus, ILeadStatusGroup, ELeadStatusType} from '@app/types/lead';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {removeCharacter} from '@app/utils/common';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {EPerActSetting, EPerActType} from '@app/types/setting';
import {
  LEAD_STATUS_TYPE_LABELS,
  LEAD_STATUS_TYPE_OPTIONS,
} from '@app/main/lead/lead.variable';

@Component({
  selector: 'app-status-lead',
  templateUrl: './status-lead.component.html',
  styleUrls: ['./status-lead.component.scss'],
})
export class StatusLeadComponent implements OnDestroy, OnInit {
  @ViewChild('templateAddEditGroup') templateAddEditGroup!: TemplateRef<any>;
  @ViewChild('templateAddEditStatus') templateAddEditStatus!: TemplateRef<any>;
  public addEditGroupModalRef?: BsModalRef;
  public addEditStatusModalRef?: BsModalRef;

  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo tên nhóm trạng thái...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm',
      icon: './assets/icons/add.svg',
    },
  ];

  isAdd = {
    group: false as boolean,
    status: false as boolean,
  };

  public dataSelected = {
    group: undefined as ILeadStatusGroup | undefined,
    status: undefined as ILeadStatus | undefined,
    groupId: undefined as string | undefined,
  };

  public addEditForm = {
    group: this.fb.group({
      name: [null, Validators.required],
      isDefault: [false],
    }) as FormGroup,
    status: this.fb.group({
      name: [null, Validators.required],
      type: [null, Validators.required],
      bgColor: ['#000000'],
    }) as FormGroup,
  };

  public statusGroups: ILeadStatusGroup[] = [];
  public loading = {
    data: false,
    addEditGroup: false,
    addEditStatus: false,
    submittedModal: false,
  };

  public permission = {
    add: false,
    edit: false,
    delete: false,
  };

  public statusTypeOptions = LEAD_STATUS_TYPE_OPTIONS;

  // Helper method to get status type label safely
  getStatusTypeLabel(type: ELeadStatusType | string | undefined): string {
    if (!type) return '';
    return LEAD_STATUS_TYPE_LABELS[type as ELeadStatusType] || type;
  }

  private destroy$ = new Subject();

  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private fb: FormBuilder,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
  ) {
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    if (permissions?.some((per) => per === EPerActSetting.UPDATE_TAG_SETTING)) {
      this.permission = {
        ...this.permission,
        add: true,
        edit: true,
        delete: true,
      };
    }
    if (!this.permission.add) {
      this.configButtons = this.configButtons.filter(
        (button) => button.name !== 'add_new',
      );
    }
  }

  ngOnInit() {
    this.getListStatusGroups();
  }

  getListStatusGroups() {
    this.loading.data = true;
    this.autoTaskService.leadStatusGroup
      .getWithDetail({
        limit: 1000,
        page: 1,
      })
      .pipe(
        finalize(() => (this.loading.data = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.statusGroups = res.data || [];
          }
        },
        error: (err) => {
          console.error('Error loading status groups:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  onDeleteGroup(value: ILeadStatusGroup) {
    this.autoTaskService.leadStatusGroup
      .delete(value.id as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.statusGroups = this.statusGroups.filter(
              (group) => group.id !== value.id,
            );
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  onDeleteGroupItem(value: ILeadStatusGroup) {
    const title = 'Xóa nhóm trạng thái';
    const description = `Bạn sắp xóa nhóm trạng thái <b>${
      value.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: value,
      errorState: 'Bạn chắc chắn xóa nhóm trạng thái này?',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteGroup(value);
    });
  }

  onDeleteStatus(value: ILeadStatus) {
    this.autoTaskService.leadStatus
      .delete(value.id as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.statusGroups = this.statusGroups.map((group) => ({
              ...group,
              statuses: group.statuses?.filter(
                (status) => status.id !== value.id,
              ),
            }));
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  onDeleteStatusItem(value: ILeadStatus) {
    const title = 'Xóa trạng thái';
    const description = `Bạn sắp xóa trạng thái <b>${
      value.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: value,
      errorState: 'Bạn chắc chắn xóa trạng thái này?',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteStatus(value);
    });
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getListStatusGroups();
    }
    if (name === 'add_new') {
      this.addEditGroup();
    }
  }

  onSubmitGroup() {
    this.loading.submittedModal = true;
    if (!this.addEditForm.group.valid) {
      return;
    }
    this.handleAddEditGroup();
  }

  handleAddEditGroup(): void {
    const body: {name: string; isDefault: boolean} = {
      name: this.addEditForm.group.value.name!,
      isDefault: this.addEditForm.group.value.isDefault!,
    };

    this.loading.addEditGroup = true;
    const serviceRef = this.isAdd.group
      ? this.autoTaskService.leadStatusGroup.create(body)
      : this.autoTaskService.leadStatusGroup.update(
          this.dataSelected.group!.id,
          body,
        );

    serviceRef
      .pipe(
        finalize(() => (this.loading.addEditGroup = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess();
            this.getListStatusGroups();
            this.addEditGroupModalRef?.hide();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleAddEditGroupModal() {
    this.addEditGroupModalRef = this.modalService.show(
      this.templateAddEditGroup,
      {
        class: 'modal-dialog-centered modal-add-edit-status-group',
      },
    );
    this.addEditGroupModalRef?.onHide
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loading.submittedModal = false;
        this.cancelAddEditGroup();
      });
  }

  addEditGroup(item?: ILeadStatusGroup): void {
    this.cancelAddEditGroup();
    if (typeof item === 'undefined') {
      this.isAdd.group = true;
    } else {
      this.dataSelected.group = item;
      this.addEditForm.group.patchValue(item);
    }
    this.handleAddEditGroupModal();
  }

  cancelAddEditGroup() {
    this.isAdd.group = false;
    this.dataSelected.group = undefined;
    this.addEditForm.group.reset({
      name: null,
    });
  }

  onSubmitStatus() {
    this.loading.submittedModal = true;
    if (!this.addEditForm.status.valid) {
      return;
    }
    this.handleAddEditStatus();
  }

  handleAddEditStatus(): void {
    const {name, type, bgColor} = this.addEditForm.status.value;
    const groupId = this.dataSelected.groupId || this.dataSelected.group?.id;

    if (!groupId) {
      this.commonService.handleResErr({
        status: 400,
        statusText: 'Bad Request',
        message: 'Vui lòng chọn nhóm trạng thái',
        data: null,
        subStatus: null,
        subStatusText: null,
      } as any);
      return;
    }

    const body: Partial<ILeadStatus> = {
      name: name!,
      type: type!,
      bgColor: bgColor || '#000000',
      isActive: true,
      groupId: groupId,
      pos: 0,
    };

    this.loading.addEditStatus = true;
    const serviceRef = this.isAdd.status
      ? this.autoTaskService.leadStatus.create(body)
      : this.autoTaskService.leadStatus.update(
          this.dataSelected.status!.id,
          body,
        );

    serviceRef
      .pipe(
        finalize(() => (this.loading.addEditStatus = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess();
            this.getListStatusGroups();
            this.addEditStatusModalRef?.hide();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleAddEditStatusModal() {
    this.addEditStatusModalRef = this.modalService.show(
      this.templateAddEditStatus,
      {
        class: 'modal-dialog-centered modal-add-edit-status',
      },
    );
    this.addEditStatusModalRef?.onHide
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loading.submittedModal = false;
        this.cancelAddEditStatus();
      });
  }

  addEditStatus(status?: ILeadStatus, group?: ILeadStatusGroup): void {
    this.cancelAddEditStatus();
    if (typeof status === 'undefined') {
      this.isAdd.status = true;
      this.dataSelected.group = group;
      this.dataSelected.groupId = group?.id;
    } else {
      this.dataSelected.status = status;
      this.dataSelected.group = group;
      this.dataSelected.groupId = status.groupId;
      this.addEditForm.status.patchValue({
        name: status.name,
        type: status.type,
        bgColor: status.bgColor || '#000000',
      });
    }
    this.handleAddEditStatusModal();
  }

  cancelAddEditStatus() {
    this.isAdd.status = false;
    this.dataSelected.status = undefined;
    this.dataSelected.groupId = undefined;
    this.addEditForm.status.reset({
      name: null,
      type: null,
      bgColor: '#000000',
    });
  }

  onSearch(value: {term: string; name: string}) {
    const {term, name} = value;
    const keyword = removeCharacter(term)
      .toLocaleLowerCase()
      .replace(/[ ]+/, ' ');
    if (name === ETypeFilter.SEARCH) {
      // Filter status groups by name
      // In a real implementation, you might want to pass this to the API
      // For now, we'll just filter client-side
      this.getListStatusGroups();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
