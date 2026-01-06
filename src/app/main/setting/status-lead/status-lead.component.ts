import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {ILeadStatus, ILeadStatusGroup, ELeadStatusType} from '@app/types/lead';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LeadService} from '@app/services/api/lead.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {EPerActSetting, EPerActType} from '@app/types/setting';
import {
  LEAD_STATUS_TYPE_LABELS,
  LEAD_STATUS_TYPE_OPTIONS,
} from '@app/main/lead/lead.variable';

enum EStatusLeadTab {
  STATUS = 'STATUS',
  STATUS_GROUP = 'STATUS_GROUP',
}

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

  public tabs = [
    {key: EStatusLeadTab.STATUS, name: 'Trạng thái'},
    {key: EStatusLeadTab.STATUS_GROUP, name: 'Nhóm trạng thái'},
  ];
  public activeTab: EStatusLeadTab = EStatusLeadTab.STATUS;
  protected readonly EStatusLeadTab = EStatusLeadTab;

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
      icon: './assets/images/icon-plus-bold.svg',
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
      leadStatusIds: [[]],
    }) as FormGroup,
    status: this.fb.group({
      name: [null, Validators.required],
      type: [null, Validators.required],
      bgColor: ['#000000'],
    }) as FormGroup,
  };

  public statusGroups: Array<ILeadStatusGroup & {statuses: ILeadStatus[]}> = [];
  public statuses: ILeadStatus[] = [];
  public statusOptions: Array<{value: string; label: string; bgColor: string}> =
    [];
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
    private readonly leadService: LeadService,
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
    this.getListStatuses();
  }

  selectTab(tab: EStatusLeadTab) {
    this.activeTab = tab;
    if (tab === EStatusLeadTab.STATUS) {
      this.getListStatuses();
    } else {
      this.getListStatusGroups();
    }
  }

  getListStatusGroups() {
    this.loading.data = true;
    this.leadService.leadStatusGroup
      .get({
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
            const groups = (res.data || []).reverse();
            // Map leadStatusIds to statuses for UI display
            this.statusGroups = groups.map((group) => ({
              ...group,
              statuses:
                group.leadStatusIds
                  ?.map((id) => this.statuses.find((s) => s.id === id))
                  .filter((s): s is ILeadStatus => !!s) || [],
            }));
          }
        },
        error: (err) => {
          console.error('Error loading status groups:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  getListStatuses() {
    this.loading.data = true;
    this.leadService.leadStatus
      .get({
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
            this.statuses = (res.data || []).reverse();
            this.statusOptions = this.getStatusOptions();
            // Reload groups to update statuses mapping
            if (this.statusGroups.length > 0) {
              this.getListStatusGroups();
            }
          }
        },
        error: (err) => {
          console.error('Error loading statuses:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  onDeleteGroup(value: ILeadStatusGroup) {
    this.leadService.leadStatusGroup
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
    this.leadService.leadStatus
      .delete(value.id as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.statusGroups = this.statusGroups.map((group) => ({
              ...group,
              leadStatusIds:
                group.leadStatusIds?.filter((id) => id !== value.id) || [],
              statuses:
                group.statuses?.filter(
                  (status: ILeadStatus) => status.id !== value.id,
                ) || [],
            }));
            this.statuses = this.statuses.filter(
              (status) => status.id !== value.id,
            );
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
      if (this.activeTab === EStatusLeadTab.STATUS) {
        this.getListStatuses();
      } else {
        this.getListStatusGroups();
      }
    }
    if (name === 'add_new') {
      if (this.activeTab === EStatusLeadTab.STATUS) {
        this.addEditStatus();
      } else {
        this.addEditGroup();
      }
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
    const body: {name: string; isDefault: boolean; leadStatusIds: string[]} = {
      name: this.addEditForm.group.value.name!,
      // isDefault: this.addEditForm.group.value.isDefault!,
      isDefault: true,
      leadStatusIds: this.addEditForm.group.value.leadStatusIds || [],
    };

    this.loading.addEditGroup = true;
    const serviceRef = this.isAdd.group
      ? this.leadService.leadStatusGroup.create(body)
      : this.leadService.leadStatusGroup.update(
          this.dataSelected.group!.id,
          body,
        );

    serviceRef
      .pipe(
        finalize(() => {
          this.loading.addEditGroup = false;
          this.addEditGroupModalRef?.hide();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getListStatusGroups();
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

  addEditGroup(item?: ILeadStatusGroup & {statuses?: ILeadStatus[]}): void {
    this.cancelAddEditGroup();
    if (typeof item === 'undefined') {
      this.isAdd.group = true;
    } else {
      this.dataSelected.group = item;
      this.addEditForm.group.patchValue({
        name: item.name,
        isDefault: item.isDefault,
        leadStatusIds:
          item.statuses?.map((s: ILeadStatus) => s.id) ||
          item.leadStatusIds ||
          [],
      });
    }
    this.handleAddEditGroupModal();
  }

  cancelAddEditGroup() {
    this.isAdd.group = false;
    this.dataSelected.group = undefined;
    this.addEditForm.group.reset({
      name: null,
      isDefault: false,
      leadStatusIds: [],
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

    const body: Partial<ILeadStatus> = {
      name: name!,
      type: type!,
      bgColor: bgColor || '#000000',
      isActive: true,
      pos: 0,
    };

    this.loading.addEditStatus = true;
    const serviceRef = this.isAdd.status
      ? this.leadService.leadStatus.create(body)
      : this.leadService.leadStatus.update(this.dataSelected.status!.id, body);

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
            this.getListStatuses();
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
    } else {
      this.dataSelected.status = status;
      this.dataSelected.group = group;
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
    this.addEditForm.status.reset({
      name: null,
      type: null,
      bgColor: '#000000',
    });
  }

  getStatusGroupOptions() {
    return this.statusGroups.map((group) => ({
      value: group.id,
      label: group.name,
    }));
  }

  getStatusOptions() {
    return this.statuses.map((status) => ({
      value: status.id,
      label: status.name,
      bgColor: status.bgColor || '#000000',
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
