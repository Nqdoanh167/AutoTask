import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  IFolderLead,
  IFunnelGroup,
  IFunnel,
  ILeadStatusGroup,
  ILeadStatus,
} from '@app/types/lead';
import {EntityPagination, EntityResult, ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ToastrService} from 'ngx-toastr';
import { IChainAct } from '@app/types/flow';
import { uniqBy } from 'lodash';

@Component({
  selector: 'app-folder-form-modal',
  templateUrl: './folder-form-modal.component.html',
  styleUrls: ['./folder-form-modal.component.scss'],
})
export class FolderFormModalComponent implements OnInit, OnDestroy {
  @Output() saveEvent = new EventEmitter<void>();
  @Input() type: 'folder' | 'group' | 'funnel' = 'folder';

  private destroy$ = new Subject<void>();
  public folderForm!: FormGroup;
  public loading = {
    submit: false,
  };
  // Nhóm trạng thái lead
  public statusGroup: EntityPagination<ILeadStatusGroup> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };

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

  public status: EntityPagination<ILeadStatus> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };

  public folder: EntityPagination<IFolderLead> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private readonly autoTaskService: AutoTaskService,
    private readonly toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    this.getStatusGroup();
    this.initForm();
    this.getActionChain();

    if (this.type === 'group' || this.type === 'funnel') {
      this.getFolder();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    // Set validators based on type
    const folderIdValidators =
      this.type === 'group' || this.type === 'funnel'
        ? [Validators.required]
        : [];

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

  getStatusGroup(): void {
    this.statusGroup.loading = true;
    this.autoTaskService.leadStatusGroup
      .get({
        limit: this.statusGroup.limit,
        page: this.statusGroup.page,
      })
      .pipe(
        finalize(() => {
          this.statusGroup.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.statusGroup.rows = res.data;
          this.statusGroup.total = res.meta?.total || 0;
        }
      });
  }

  getStatusByGroupId(groupId: string): void {
    this.status.loading = true;
    this.autoTaskService.leadStatus
      .get({
        limit: this.status.limit,
        page: this.status.page,
        filter: JSON.stringify({groupId}),
      })
      .pipe(
        finalize(() => {
          this.status.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.status.rows = res.data;
          this.status.total = res.meta?.total || 0;
        }
      });
  }

  getFolder(): void {
    this.folder.loading = true;
    this.autoTaskService.leadFolder
      .getWithFunnels({
        limit: this.folder.limit,
        page: this.folder.page,
      })
      .pipe(
        finalize(() => {
          this.folder.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.folder.rows = res.data;
          this.folder.total = res.meta?.total || 0;
        }
      });
  }

  // Lấy theo folder
  get funnelGroups(): IFunnelGroup[] {
    const selectedFolderId = this.folderForm?.get('folderId')?.value;
    if (!selectedFolderId) return [];

    const selectedFolder = this.folder.rows.find(
      (folder) => folder.id === selectedFolderId,
    );
    return selectedFolder?.funnelGroups || [];
    // return this.folder.rows.map((folder) => folder.funnelGroups).flat(); // Cần chọn folder trước
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

  onCancel(): void {
    this.bsModalRef.hide();
  }

  onSubmit(): void {
    if (this.folderForm.invalid) {
      this.folderForm.markAllAsTouched();
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
        createObservable = this.autoTaskService.leadFolder.create(body);
        successMessage = 'Tạo thư mục thành công';
        errorMessage = 'Tạo thư mục thất bại';
        break;

      case 'group':
        body = {
          name: this.folderForm.value.name,
          folderId: this.folderForm.value.folderId,
          statusGroupId: this.folderForm.value.statusGroupId,
        };
        createObservable = this.autoTaskService.leadGroupFunnel.create(body);
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
        createObservable = this.autoTaskService.leadFunnel.create(body);
        successMessage = 'Tạo phễu thành công';
        errorMessage = 'Tạo phễu thất bại';
        break;
    }

    createObservable
      .pipe(
        finalize(() => {
          this.loading.submit = false;
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
