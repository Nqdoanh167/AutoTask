import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {finalize, takeUntil} from 'rxjs';
import {IFolderLead, IFunnelGroup, IFunnel, ILeadStatus} from '@app/types/lead';
import {EntityResult, ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {ToastrService} from 'ngx-toastr';
import {IChainAct} from '@app/types/flow';
import {uniqBy} from 'lodash';
import {LeadDashboardData} from '../lead-dashboard-data';

@Component({
  selector: 'app-folder-form-modal',
  templateUrl: './folder-form-modal.component.html',
  styleUrls: ['./folder-form-modal.component.scss'],
})
export class FolderFormModalComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Output() saveEvent = new EventEmitter<void>();
  @Input() type: 'folder' | 'group' | 'funnel' = 'folder';
  @Input() dataSource?: IFolderLead | IFunnelGroup | IFunnel;

  public folderForm!: FormGroup;
  public loading = {
    submit: false,
  };
  public submitted = false;

  public actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 1000,
      sort: '-createdAt',
      filter: JSON.stringify({isActive: true}),
    },
    isAllowLoadMore: false,
  };
  public statusesByGroupId: ILeadStatus[] = [];
  public funnelGroupOptions: Array<IFunnelGroup & {folderName: string}> = [];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private readonly toastrService: ToastrService,
  ) {
    super();
  }

  get f(): {[key: string]: AbstractControl} {
    return this.folderForm.controls;
  }

  override ngOnInit(): void {
    this.initForm();
    this.getActionChain();
    this.getFoldersCache();

    this.folderForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value.statusGroupId) {
          const group = this.statusGroups.rows.find(
            (group) => group.id === value.statusGroupId,
          );
          if (group) {
            this.statusesByGroupId = group.leadStatusIds
              .map((statusId) =>
                this.statuses.rows.find((status) => status.id === statusId),
              )
              .filter(Boolean) as ILeadStatus[];
          }
        }
      });

    if (this.dataSource) {
      this.folderForm.patchValue(this.dataSource);
    }
  }

  private initForm(): void {
    // Set validators based on type
    const folderIdValidators =
      this.type === 'group' ? [Validators.required] : [];

    const funnelGroupIdValidators =
      this.type === 'funnel' ? [Validators.required] : [];

    this.folderForm = this.fb.group({
      name: [null, [Validators.required]],
      folderId: [null, folderIdValidators],
      funnelGroupId: [null, funnelGroupIdValidators],
      statusGroupId: [null, [Validators.required]],
      isAutoCreateTask: [false],
      addChainActIds: [[]],
    });
  }

  get nameTitle(): string {
    switch (this.type) {
      case 'folder':
        return 'Thư mục';
      case 'group':
        return 'Nhóm phễu';
      case 'funnel':
        return 'Phễu';
    }
  }

  // Lấy theo folder
  get funnelGroups(): IFunnelGroup[] {
    const selectedFolderId = this.folderForm?.get('folderId')?.value;
    if (!selectedFolderId) return [];

    const selectedFolder = this.folder.rows.find(
      (folder) => folder.id === selectedFolderId,
    );
    return selectedFolder?.funnelGroups || [];
  }

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        finalize(() => {
          this.actionChains.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actionChains.rows = uniqBy(
              this.actionChains.rows.concat(res.data),
              'id',
            );
            this.autoTaskService.setListChainAct(this.actionChains.rows);
            this.actionChains.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.toastrService.error(res.message);
            this.actionChains.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actionChains.isAllowLoadMore = false;
          this.toastrService.error(err.message);
        },
      });
  }

  override getFoldersCache() {
    this.leadService.listLeadFolder
      .pipe(
        finalize(() => (this.folder.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.folder.rows = res || [];
        this.transformFunnelGroupOptions();
      });
  }

  transformFunnelGroupOptions(): void {
    this.funnelGroupOptions = [];
    this.folder.rows.forEach((folder) => {
      folder.funnelGroups?.forEach((funnelGroup) => {
        this.funnelGroupOptions.push({
          ...funnelGroup,
          folderName: folder.name,
        });
      });
    });
  }

  groupByFolder = (item: IFunnelGroup & {folderName: string}) => {
    return `${item.folderName}`;
  };

  handleChangeFolder(folder: IFolderLead) {
    if (this.folderForm?.get('statusGroupId')?.value) {
      return;
    }
    this.folderForm.patchValue({
      statusGroupId: folder.statusGroupId,
    });
  }

  handleChangeFunnelGroup(group: IFunnelGroup) {
    if (this.folderForm?.get('statusGroupId')?.value) {
      return;
    }
    this.folderForm.patchValue({
      statusGroupId: group.statusGroupId,
    });
  }

  onCancel(): void {
    this.bsModalRef.hide();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.folderForm.invalid) {
      return;
    }

    this.loading.submit = true;

    // Prepare body based on type
    let body: any;
    let createObservable: any;
    let successMessage: string;
    let errorMessage: string;

    switch (this.type) {
      case 'folder':
        body = {
          name: this.folderForm.value.name,
          statusGroupId: this.folderForm.value.statusGroupId,
        };
        createObservable = this.leadService.leadFolder.create(body);
        successMessage = 'Tạo thư mục thành công';
        errorMessage = 'Tạo thư mục thất bại';
        break;

      case 'group':
        body = {
          name: this.folderForm.value.name,
          folderId: this.folderForm.value.folderId,
          statusGroupId: this.folderForm.value.statusGroupId,
        };
        createObservable = this.leadService.leadGroupFunnel.create(body);
        successMessage = 'Tạo nhóm phễu thành công';
        errorMessage = 'Tạo nhóm phễu thất bại';
        break;

      case 'funnel':
        body = {
          name: this.folderForm.value.name,
          folderId: this.folderForm.value.folderId,
          funnelGroupId: this.folderForm.value.funnelGroupId,
          statusGroupId: this.folderForm.value.statusGroupId,
          isAutoCreateTask: this.folderForm.value.isAutoCreateTask,
          addChainActIds: this.folderForm.value.addChainActIds,
        };
        createObservable = this.leadService.leadFunnel.create(body);
        successMessage = 'Tạo phễu thành công';
        errorMessage = 'Tạo phễu thất bại';
        break;
    }

    createObservable
      .pipe(
        finalize(() => {
          this.loading.submit = false;
          this.submitted = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: EntityResult<IFolderLead | IFunnelGroup | IFunnel>) => {
          if (res.status === 200 || res.status === 201) {
            this.toastrService.success(successMessage);
            this.bsModalRef.hide();
            this.saveEvent.emit();
          } else {
            this.toastrService.error(errorMessage);
          }
        },
      });
  }
}
