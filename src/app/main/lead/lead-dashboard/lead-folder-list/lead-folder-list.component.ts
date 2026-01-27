import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {BehaviorSubject} from 'rxjs';
import {LeadDashboardData} from '../lead-dashboard-data';
import {IFunnel, IFolderLead, IFunnelGroup} from '@app/types/lead';
import {EntityPagination} from '@app/types/viewmodels';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {takeUntil, finalize} from 'rxjs';
import {FolderFormModalComponent} from '../folder-form-modal/folder-form-modal.component';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-lead-folder-list',
  templateUrl: './lead-folder-list.component.html',
  styleUrls: ['./lead-folder-list.component.scss'],
})
export class LeadFolderListComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Input() currentFunnel$!: BehaviorSubject<IFunnel | null>;
  @Output() funnelSelected = new EventEmitter<IFunnel>();
  @Output() folderReloaded = new EventEmitter<void>();

  // Expose method for parent to call
  public reloadFolders() {
    this.getFolderLead();
  }

  public expandedFunnelGroups: Map<string, Set<string>> = new Map();
  public expandedFolders: Set<string> = new Set();
  public folderLeads: EntityPagination<IFolderLead> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };
  private _folderLeads: IFolderLead[] = [];

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastrService: ToastrService,
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly modalConfirmService: ModalConfirmService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.getFolderLead();

    // Subscribe vào currentFunnel$ để tự động mở funnel group khi thay đổi
    if (this.currentFunnel$) {
      this.currentFunnel$.pipe(takeUntil(this.destroy$)).subscribe((funnel) => {
        if (funnel) {
          this.openFunnelGroup(funnel.id!);
        }
      });
    }
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFolderLead(): void {
    this.folderLeads.loading = true;
    this.leadService.leadFolder
      .getWithFunnels({
        page: 1,
        limit: 1000,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.folderLeads.loading = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.folderLeads.rows = res.data;
            this._folderLeads = res.data;
            this.leadService.setListLeadFolder(res.data);

            // Nếu chưa có currentFolderId, lấy funnel đầu tiên
            if (
              this.currentFunnel$ &&
              !this.currentFunnel$.value &&
              this.folderLeads.rows.length > 0
            ) {
              const firstFunnel = this.folderLeads.rows
                .flatMap((folder) => folder.funnelGroups || [])
                .flatMap((group) => group.funnels || [])
                .find((funnel) => funnel.id);

              if (firstFunnel) {
                this.currentFunnel$.next(firstFunnel);
                this.funnelSelected.emit(firstFunnel);
              }
            }
            this.folderReloaded.emit();
          }
        },
        error: (err: any) => {
          console.error('Error loading folder leads:', err);
        },
      });
  }

  toggleFolder(folderId: string): void {
    if (this.expandedFolders.has(folderId)) {
      this.expandedFolders.delete(folderId);
    } else {
      this.expandedFolders.add(folderId);
    }
  }

  isFolderExpanded(folderId: string): boolean {
    return this.expandedFolders.has(folderId);
  }

  toggleFunnelGroup(folderId: string, groupId: string): void {
    if (!this.expandedFunnelGroups.has(folderId)) {
      this.expandedFunnelGroups.set(folderId, new Set());
    }
    const groups = this.expandedFunnelGroups.get(folderId)!;
    if (groups.has(groupId)) {
      groups.delete(groupId);
    } else {
      groups.add(groupId);
    }
  }

  isFunnelGroupExpanded(folderId: string, groupId: string): boolean {
    return this.expandedFunnelGroups.get(folderId)?.has(groupId) || false;
  }

  private openFunnelGroup(funnelId: string): void {
    for (const folder of this.folderLeads.rows) {
      if (!folder.id) continue;

      for (const group of folder.funnelGroups || []) {
        if (!group.id) continue;

        const hasFunnel = group.funnels?.some((f: any) => f.id === funnelId);
        if (hasFunnel) {
          this.expandedFolders.add(folder.id);
          if (!this.expandedFunnelGroups.has(folder.id)) {
            this.expandedFunnelGroups.set(folder.id, new Set());
          }
          this.expandedFunnelGroups.get(folder.id)!.add(group.id);
          return;
        }
      }
    }
  }

  selectFunnel(funnel: IFunnel): void {
    if (this.currentFunnel$) {
      this.currentFunnel$.next(funnel);
    }
    this.funnelSelected.emit(funnel);
  }

  handleAddFolder(
    type: 'folder' | 'group' | 'funnel' = 'folder',
    option?: {folderId?: string; groupId?: string},
  ) {
    const modalRef = this.modalService.show(FolderFormModalComponent, {
      class: 'modal-dialog-centered modal-md',
      initialState: {
        type: type,
        folderId: option?.folderId,
        groupId: option?.groupId,
      },
    });

    modalRef.content?.saveEvent?.subscribe(() => {
      this.getFolderLead();
    });
  }

  handleEditFolder(
    folder: IFolderLead | IFunnelGroup | IFunnel,
    type: 'folder' | 'group' | 'funnel' = 'folder',
  ) {
    const modalRef = this.modalService.show(FolderFormModalComponent, {
      class: 'modal-dialog-centered modal-md',
      initialState: {
        type,
        dataSource: folder,
      },
    });

    modalRef.content?.saveEvent?.subscribe(() => {
      this.getFolderLead();
    });
  }

  handleDeleteFolder(folderId: string): void {
    const title = 'Xóa Folder';
    const description = `Bạn có chắc chắn muốn xóa Folder này không? Hành động này không thể hoàn tác. 
Tất cả các Nhóm Phễu, Phễu và dữ liệu liên quan trong Folder này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteFolder(folderId);
    });
  }

  handleDeleteGroup(groupId: string): void {
    const title = 'Xóa Nhóm Phễu';
    const description = `Bạn có chắc chắn muốn xóa Nhóm Phễu này không? Hành động này không thể hoàn tác. 
Tất cả các Phễu và dữ liệu liên quan trong Nhóm Phễu này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteGroup(groupId);
    });
  }

  handleDeleteFunnel(funnelId: string): void {
    const title = 'Xóa Phễu';
    const description = `Bạn có chắc chắn muốn xóa Phễu này không? Hành động này không thể hoàn tác. 
Tất cả dữ liệu liên quan đến Phễu này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteFunnel(funnelId);
    });
  }

  private deleteFolder(folderId: string): void {
    this.leadService.leadFolder.delete(folderId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Folder thành công');
          this.getFolderLead();

          if (this.currentFunnel$?.value?.id) {
            const folder = this.folderLeads.rows.find((f) => f.id === folderId);
            if (folder) {
              const hasCurrentFunnel = folder.funnelGroups?.some(
                (group) =>
                  group.funnels?.some(
                    (f) => f.id === this.currentFunnel$.value?.id,
                  ),
              );
              if (hasCurrentFunnel) {
                this.currentFunnel$.next(null);
                this.funnelSelected.emit(null as any);
              }
            }
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Folder thất bại');
      },
    });
  }

  private deleteGroup(groupId: string): void {
    this.leadService.leadGroupFunnel.delete(groupId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Nhóm Phễu thành công');
          this.getFolderLead();

          if (this.currentFunnel$?.value?.id) {
            for (const folder of this.folderLeads.rows) {
              const group = folder.funnelGroups?.find((g) => g.id === groupId);
              if (group) {
                const hasCurrentFunnel = group.funnels?.some(
                  (f) => f.id === this.currentFunnel$.value?.id,
                );
                if (hasCurrentFunnel) {
                  this.currentFunnel$.next(null);
                  this.funnelSelected.emit(null as any);
                }
                break;
              }
            }
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Nhóm Phễu thất bại');
      },
    });
  }

  private deleteFunnel(funnelId: string): void {
    this.leadService.leadFunnel.delete(funnelId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Phễu thành công');
          this.getFolderLead();

          if (this.currentFunnel$?.value?.id === funnelId) {
            this.currentFunnel$.next(null);
            this.funnelSelected.emit(null as any);
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Phễu thất bại');
      },
    });
  }

  onSearchFolder(term: string) {
    const searchTerm = term?.trim() || '';

    if (!searchTerm) {
      this.folderLeads.rows = [...this._folderLeads];
      return;
    }

    this.folderLeads.rows = this._folderLeads.filter((folder) =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }
}
