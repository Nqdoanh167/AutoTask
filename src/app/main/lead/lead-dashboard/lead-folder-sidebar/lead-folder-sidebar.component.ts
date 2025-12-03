import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '@app/services/api/socket.service';

export interface ILeadFolder {
  id: string;
  name: string;
  icon?: string;
  type: 'folder' | 'funnel';
  parentId?: string;
  children?: ILeadFolder[];
  isExpanded?: boolean;
  isPinned?: boolean;
  isEmpty?: boolean;
  isSystem?: boolean;
  funnels?: any[];
  statLeadCount?: number; // Number of leads in the funnel
} 

@Component({
  selector: 'app-lead-folder-sidebar',
  templateUrl: './lead-folder-sidebar.component.html',
  styleUrls: ['./lead-folder-sidebar.component.scss'],
})
export class LeadFolderSidebarComponent implements OnInit, OnDestroy {
  @Output() folderSelected = new EventEmitter<ILeadFolder>();
  @Output() folderAction = new EventEmitter<{action: string; folder: ILeadFolder}>();
  @Output() addLeadClick = new EventEmitter<void>();
  @Output() addFunnelClick = new EventEmitter<void>();
  @Output() foldersLoaded = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() hardRefreshCompleted = new EventEmitter<void>();

  public folders: ILeadFolder[] = [];
  public selectedFolder?: ILeadFolder;
  public contextMenuFolder?: ILeadFolder;
  public contextMenuPosition = { x: 0, y: 0 };
  public showContextMenu = false;
  public contextMenuType: ILeadFolder['type'] = 'folder';
  public showAddDropdown = false;
  public loading = false;
  public allFoldersExpanded = false;

  // Search funnel properties
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  public searchQuery = '';
  public searchResults: any[] = [];
  public isSearching = false;

  // Track local actions to prevent socket event conflicts
  private lastLocalActionTime = 0;
  private readonly LOCAL_ACTION_DEBOUNCE_MS = 2000; // 2 seconds

  constructor(
    private autoTaskService: AutoTaskService,
    private toastrService: ToastrService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadFoldersWithFunnels(false, false, true); // Auto-select first funnel on initial load
    this.setupSearchSubscription();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadFoldersWithFunnels(forceRefresh = false, markAsLocalAction = false, autoSelectFirst = false) {
    // Mark as local action if requested (to prevent socket event conflicts)
    if (markAsLocalAction) {
      this.markLocalAction();
    }

    // Fetch from API
    this.loading = true;
    this.autoTaskService.leadFolder.getWithFunnels().subscribe({
      next: (response) => {
        if (response?.status === 200 && response.data) {
          this.folders = this.transformFoldersData(response.data);

          // Auto-select first funnel if requested
          if (autoSelectFirst) {
            this.autoSelectFirstFunnel();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading folders with funnels:', error);
        this.loading = false;
        // Fallback to default folders on error
        this.folders = this.getDefaultFolders();
      }
    });
  }

  transformFoldersData(folders: any[]): ILeadFolder[] {
    const result: ILeadFolder[] = [];
    const pinnedFunnels: any[] = [];

    // Collect all pinned funnels from all folders
    folders.forEach(folder => {
      if (folder.funnels && folder.funnels.length > 0) {
        folder.funnels.forEach((funnel: any) => {
          if (funnel.isPinned) {
            pinnedFunnels.push({
              ...funnel,
              originalFolderId: folder.id,
              originalFolderName: folder.name
            });
          }
        });
      }
    });

    // Sort pinned funnels alphabetically by name (a->z)
    pinnedFunnels.sort((a: any, b: any) => a?.name?.localeCompare(b?.name, 'vi'));

    // Always add Pinned section (even if empty)
    result.push({
      id: 'pinned',
      name: 'Pinned',
      type: 'folder',
      icon: 'pi pi-bookmark',
      isPinned: true,
      isExpanded: true,
      children: pinnedFunnels.map(funnel => ({
        id: funnel.id,
        name: funnel.name,
        type: 'funnel' as const,
        parentId: 'pinned',
        isPinned: true,
        isSystem: funnel.isSystem || false,
        funnels: [funnel],
        statLeadCount: funnel.statLeadCount || 0
      }))
    });

    // Sort folders: non-system folders first, system folders last
    const sortedFolders = folders.sort((a, b) => {
      if (a.isSystem === b.isSystem) return 0;
      return a.isSystem ? 1 : -1;
    });

    // Add regular folders with non-pinned funnels
    sortedFolders.forEach(folder => {
      const nonPinnedFunnels = folder.funnels?.filter((f: any) => !f.isPinned && !f.isHidden) || [];
      
      // Sort non-pinned funnels alphabetically by name (a->z)
      nonPinnedFunnels.sort((a: any, b: any) => a?.name?.localeCompare(b?.name, 'vi'));

      result.push({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        icon: 'pi pi-folder',
        isExpanded: false,
        isEmpty: folder.isEmpty || nonPinnedFunnels.length === 0,
        isSystem: folder.isSystem || false,
        children: nonPinnedFunnels.map((funnel: any) => ({
          id: funnel.id,
          name: funnel.name,
          type: 'funnel' as const,
          parentId: folder.id,
          isPinned: false,
          isSystem: funnel.isSystem || false,
          funnels: [funnel],
          statLeadCount: funnel.statLeadCount || 0
        }))
      });
    });

    return result;
  }

  getDefaultFolders(): ILeadFolder[] {
    return [
      {
        id: 'pinned',
        name: 'Pinned',
        type: 'funnel',
        isPinned: true,
      },
      {
        id: 'gia-han-zns',
        name: 'Gia hạn ZNS',
        type: 'funnel',
      },
      {
        id: 'gia-han-goi-cuoc',
        name: 'Gia hạn gói cước',
        type: 'funnel',
      },
      {
        id: 'nang-cap-sendcard',
        name: 'Nâng cấp Sendcard',
        type: 'folder',
      },
      {
        id: 'may-do-doanh-nghiep',
        name: 'Máy đo doanh nghiệp',
        type: 'funnel',
      },
      {
        id: 'zns-folder',
        name: 'ZNS',
        type: 'folder',
        icon: 'fa fa-folder',
        isExpanded: false,
        children: [
          { id: 'zns-1', name: 'Gia hạn ZNS', type: 'funnel', parentId: 'zns-folder' },
          { id: 'zns-2', name: 'Gia hạn ZNS', type: 'funnel', parentId: 'zns-folder' },
          { id: 'zns-3', name: 'Gia hạn ZNS', type: 'funnel', parentId: 'zns-folder' },
          { id: 'zns-4', name: 'Gia hạn ZNS', type: 'funnel', parentId: 'zns-folder' },
        ],
      },
      {
        id: 'automation-folder',
        name: 'Automation',
        type: 'folder',
        icon: 'fa fa-folder',
        isExpanded: false,
        children: [
          { id: 'auto-1', name: 'Nâng cấp Sendcard', type: 'funnel', parentId: 'automation-folder' },
          { id: 'auto-2', name: 'Nâng cấp Sendcard', type: 'funnel', parentId: 'automation-folder' },
          { id: 'auto-3', name: 'Nâng cấp Sendcard', type: 'funnel', parentId: 'automation-folder' },
          { id: 'auto-4', name: 'Nâng cấp Sendcard', type: 'funnel', parentId: 'automation-folder' },
          { id: 'auto-5', name: 'Nâng cấp Sendcard', type: 'funnel', parentId: 'automation-folder' },
        ],
      },
    ];
  }

  saveFolders() {
    localStorage.setItem('leadFolders', JSON.stringify(this.folders));
  }

  selectFolder(folder: ILeadFolder) {
    this.selectedFolder = folder;
    this.folderSelected.emit(folder);
  }

  toggleFolder(folder: ILeadFolder) {
    if (folder.type === 'folder') {
      folder.isExpanded = !folder.isExpanded;
      this.saveFolders();
    } else {
      this.selectFolder(folder);
    }
  }

  toggleAllFolders() {
    this.allFoldersExpanded = !this.allFoldersExpanded;
    this.folders.forEach(folder => {
      // Skip Pinned folder as it should always be expanded
      if (folder.type === 'folder' && folder.id !== 'pinned' && !folder.isPinned) {
        folder.isExpanded = this.allFoldersExpanded;
      }
    });
    this.saveFolders();
  }

  getExpandAllTooltip(): string {
    return this.allFoldersExpanded ? 'Đóng toàn bộ' : 'Mở toàn bộ';
  }

  getExpandAllIcon(): string {
    return this.allFoldersExpanded
      ? 'fa-solid fa-down-left-and-up-right-to-center'
      : 'fa-solid fa-up-right-and-down-left-from-center';
  }

  onContextMenu(event: MouseEvent, folder: ILeadFolder) {
    event.preventDefault();
    event.stopPropagation();
    
    // Don't show context menu for system folders (except for system funnels - they can be pinned)
    if (folder.isSystem && folder.type === 'folder') {
      return;
    }
    
    // Don't show context menu for Pinned folder header (but allow for funnels inside Pinned)
    if (folder.isPinned && folder.type === 'folder') {
      return;
    }
    
    this.contextMenuFolder = folder;
    this.contextMenuType = folder.type;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.showContextMenu = true;
  }

  handleContextMenuAction(action: string) {
    if (this.contextMenuFolder) {
      this.folderAction.emit({ action, folder: this.contextMenuFolder });
      
      switch (action) {
        case 'rename':
          this.renameFolder(this.contextMenuFolder);
          break;
        case 'delete':
          this.deleteFolder(this.contextMenuFolder);
          break;
        case 'edit':
          this.editFunnel(this.contextMenuFolder);
          break;
        case 'pin':
          this.pinFunnel(this.contextMenuFolder);
          break;
        case 'hide':
          this.hideFunnel(this.contextMenuFolder);
          break;
      }
    }
    this.closeContextMenu();
  }

  renameFolder(folder: ILeadFolder) {
    const newName = prompt('Nhập tên mới:', folder.name);
    if (newName && newName.trim()) {
      this.loading = true;
      this.autoTaskService.leadFolder.update(folder.id, { name: newName.trim() }).subscribe({
        next: (response) => {
          if (response?.status === 200) {
            console.log('Updated folder name successfully');
            
            // Reload folders
            this.loadFoldersWithFunnels(true);
            
            // Mark this as a local action to ignore socket event
            this.markLocalAction();
            
            this.toastrService.success('Đổi tên thư mục thành công');
          } else {
            this.loading = false;
            this.toastrService.error('Có lỗi xảy ra khi đổi tên thư mục. Vui lòng thử lại.');
          }
        },
        error: (error) => {
          console.error('Error updating folder name:', error);
          this.loading = false;
          this.toastrService.error('Có lỗi xảy ra khi đổi tên thư mục. Vui lòng thử lại.');
        }
      });
    }
  }

  deleteFolder(folder: ILeadFolder) {
    if (folder.type === 'funnel') {
      // Don't allow deleting system funnels
      if (folder.isSystem || folder.funnels?.[0]?.isSystem) {
        this.toastrService.warning('Không thể xóa phễu hệ thống');
        return;
      }
      
      // Check if funnel can be deleted
      if (!this.canDeleteFunnel(folder)) {
        const leadCount = this.getLeadCount(folder);
        this.toastrService.warning(
          `Không thể xóa phễu "${folder.name}" vì đang có ${leadCount} lead. Vui lòng ẩn phễu thay vì xóa.`
        );
        return;
      }

      // Delete funnel via API
      if (confirm(`Bạn có chắc chắn muốn xóa phễu "${folder.name}"?`)) {
        const funnelId = folder.funnels?.[0]?.id || folder.id;
        this.loading = true;
        this.autoTaskService.leadFunnel.delete(funnelId).subscribe({
          next: (response) => {
            if (response?.status === 200) {
              console.log('Deleted funnel successfully');
              
              // Update UI immediately - filter out deleted funnel from local state
              this.removeFunnelFromLocalState(funnelId);

              // Notify other components about funnel data changes
              this.autoTaskService.notifyFunnelDataChanged();
              
              // Mark this as a local action to ignore socket event (for 2 seconds)
              this.markLocalAction();
              
              this.loading = false;
              this.toastrService.success('Xóa phễu thành công');
            } else {
              this.loading = false;
              this.toastrService.error('Có lỗi xảy ra khi xóa phễu. Vui lòng thử lại.');
            }
          },
          error: (error) => {
            console.error('Error deleting funnel:', error);
            this.loading = false;
            this.toastrService.error('Có lỗi xảy ra khi xóa phễu. Vui lòng thử lại.');
          }
        });
      }
  } else {
    // Delete folder via API
    if (confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}"?`)) {
      this.loading = true;
      this.autoTaskService.leadFolder.delete(folder.id).subscribe({
        next: (response) => {
          if (response?.status === 200) {
            console.log('Deleted folder successfully');
            
            // Update UI immediately - filter out deleted folder from local state
            this.folders = this.folders.filter(f => f.id !== folder.id);

            // Notify other components about funnel data changes
            this.autoTaskService.notifyFunnelDataChanged();

            // Mark this as a local action to ignore socket event
            this.markLocalAction();

            this.loading = false;
            this.toastrService.success('Xóa thư mục thành công');
          } else {
            this.loading = false;
            this.toastrService.error('Có lỗi xảy ra khi xóa thư mục. Vui lòng thử lại.');
          }
        },
        error: (error) => {
          console.error('Error deleting folder:', error);
          this.loading = false;
          this.toastrService.error('Có lỗi xảy ra khi xóa thư mục. Vui lòng thử lại.');
        }
      });
    }
  }
  }

  editFunnel(folder: ILeadFolder) {
    // Don't allow editing system funnels
    if (folder.isSystem || folder.funnels?.[0]?.isSystem) {
      this.toastrService.warning('Không thể chỉnh sửa phễu hệ thống');
      return;
    }
    
    // Emit action to parent component to open edit modal
    this.folderAction.emit({ action: 'edit-funnel', folder });
  }

  pinFunnel(folder: ILeadFolder) {
    const funnelId = folder.funnels?.[0]?.id || folder.id;
    const currentPinStatus = folder.isPinned || folder.funnels?.[0]?.isPinned;
    const newPinStatus = !currentPinStatus;
    
    this.loading = true;
    this.autoTaskService.leadFunnel.update(funnelId, { isPinned: newPinStatus }).subscribe({
      next: (response) => {
        if (response?.status === 200) {
          console.log(`${currentPinStatus ? 'Unpinned' : 'Pinned'} funnel successfully`);

          // Notify other components about funnel data changes
          this.autoTaskService.notifyFunnelDataChanged();

          // Update local state instead of reloading from API
          this.updateFunnelPinStatusLocally(funnelId, newPinStatus, folder);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error pinning funnel:', error);
        this.loading = false;
        alert('Có lỗi xảy ra khi ghim phễu. Vui lòng thử lại.');
      }
    });
  }

  private updateFunnelPinStatusLocally(funnelId: string, isPinned: boolean, folder: ILeadFolder) {
    // Find and update the funnel in local state
    let funnelData: any = null;
    let sourceFolderId: string = '';

    // Find the funnel in folders array
    for (const f of this.folders) {
      if (f.type === 'folder' && f.id !== 'pinned' && f.children) {
        const funnelChild = f.children.find(child => child.id === funnelId);
        if (funnelChild && funnelChild.funnels?.[0]) {
          funnelData = { ...funnelChild.funnels[0] };
          sourceFolderId = f.id;
          
          // Update isPinned in the funnel data
          funnelData.isPinned = isPinned;
          
          // Save originalFolderId when pinning
          if (isPinned) {
            funnelData.originalFolderId = f.id;
            funnelData.originalFolderName = f.name;
          }
          
          // Remove from current location
          f.children = f.children.filter(c => c.id !== funnelId);
          break;
        }
      }
    }

    // If not found in regular folders, check pinned folder (when unpinning)
    if (!funnelData) {
      const pinnedFolder = this.folders.find(f => f.id === 'pinned');
      if (pinnedFolder && pinnedFolder.children) {
        const funnelChild = pinnedFolder.children.find(child => child.id === funnelId);
        if (funnelChild && funnelChild.funnels?.[0]) {
          funnelData = { ...funnelChild.funnels[0] };
          sourceFolderId = funnelData.originalFolderId || '';
          
          // Update isPinned
          funnelData.isPinned = isPinned;
          
          // Remove from pinned
          pinnedFolder.children = pinnedFolder.children.filter(c => c.id !== funnelId);
        }
      }
    }

    if (!funnelData) return;

    if (isPinned) {
      // Add to Pinned section
      let pinnedFolder = this.folders.find(f => f.id === 'pinned');
      if (pinnedFolder) {
        const newFunnelItem: ILeadFolder = {
          id: funnelData.id,
          name: funnelData.name,
          type: 'funnel',
          parentId: 'pinned',
          isPinned: true,
          funnels: [funnelData],
          statLeadCount: funnelData.statLeadCount || 0
        };
        
        if (!pinnedFolder.children) {
          pinnedFolder.children = [];
        }
        pinnedFolder.children.push(newFunnelItem);
        
        // Sort pinned funnels alphabetically
        pinnedFolder.children.sort((a: any, b: any) => a?.name?.localeCompare(b?.name, 'vi'));
      }
    } else {
      // Add back to original folder
      const originalFolder = this.folders.find(f => f.id === sourceFolderId);
      if (originalFolder) {
        const newFunnelItem: ILeadFolder = {
          id: funnelData.id,
          name: funnelData.name,
          type: 'funnel',
          parentId: sourceFolderId,
          isPinned: false,
          funnels: [funnelData],
          statLeadCount: funnelData.statLeadCount || 0
        };
        
        if (!originalFolder.children) {
          originalFolder.children = [];
        }
        originalFolder.children.push(newFunnelItem);
        
        // Sort funnels alphabetically
        originalFolder.children.sort((a: any, b: any) => a?.name?.localeCompare(b?.name, 'vi'));
      }
    }

    // Trigger change detection
    this.folders = [...this.folders];
  }

  hideFunnel(folder: ILeadFolder) {
    // Don't allow hiding system funnels
    if (folder.isSystem || folder.funnels?.[0]?.isSystem) {
      this.toastrService.warning('Không thể ẩn phễu hệ thống');
      return;
    }
    
    const funnelId = folder.funnels?.[0]?.id || folder.id;
    
    if (confirm(`Bạn có chắc chắn muốn ẩn phễu "${folder.name}"?`)) {
      this.loading = true;
      this.autoTaskService.leadFunnel.update(funnelId, { isHidden: true }).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.status === 200) {
            console.log('Hidden funnel successfully');
            
            // Update UI immediately - remove hidden funnel from local state
            this.removeFunnelFromLocalState(funnelId);

            // Notify other components about funnel data changes
            this.autoTaskService.notifyFunnelDataChanged();
            
            // Mark this as a local action to ignore socket event
            this.markLocalAction();
            
            this.toastrService.success('Ẩn phễu thành công');
          } else {
            if (response?.status === 400) {
              this.toastrService.warning(response?.data || response?.message || 'Có lỗi xảy ra khi ẩn phễu. Vui lòng thử lại.');
            }
            console.error('Error hiding funnel:', response);
          }
        },
        error: (error) => {
          console.error('Error hiding funnel:', error);
          this.loading = false;
          this.toastrService.error('Có lỗi xảy ra khi ẩn phễu. Vui lòng thử lại.');
        }
      });
    }
  }

  findFolderById(id: string, folders: ILeadFolder[]): ILeadFolder | undefined {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = this.findFolderById(id, folder.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  closeContextMenu() {
    this.showContextMenu = false;
    this.contextMenuFolder = undefined;
  }

  /**
   * Check if funnel can be deleted (no leads in it)
   */
  canDeleteFunnel(folder: ILeadFolder): boolean {
    if (folder.type !== 'funnel') {
      return true; // Folders can always be deleted
    }
    
    const leadCount = folder.statLeadCount || folder.funnels?.[0]?.statLeadCount || 0;
    return leadCount === 0;
  }

  /**
   * Get lead count from folder/funnel
   */
  getLeadCount(folder: ILeadFolder): number {
    return folder.statLeadCount || folder.funnels?.[0]?.statLeadCount || 0;
  }

  /**
   * Setup socket listeners for real-time updates
   */
  private setupSocketListeners(): void {
    // Listen for funnel stats updates (when leads are added/removed/moved)
    this.socketService.listen('lead/FUNNEL_STAT_UPDATED')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.handleFunnelStatUpdated(data);
      });

    // Listen for funnel lead count updates
    this.socketService.listen('lead/UPDATED_FUNNEL_LEAD_COUNT')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.handleFunnelLeadCountUpdated(data);
      });

    // Listen for folder/funnel structure changes (keep existing functionality)
    this.socketService.listen('lead/FOLDER_WITH_FUNNEL_SYNCHRONIZED')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        // Skip socket update if this is from a recent local action
        // (to avoid reloading when current user just made the change)
        if (this.isRecentLocalAction()) {
          console.log('Skipping socket update - recent local action detected');
          return;
        }

        // Reload entire folder structure when major changes happen from other users/tabs
        this.loadFoldersWithFunnels(true);
      });
  }

  /**
   * Handle funnel stat update from socket
   * Updates statLeadCount for specific funnel without reloading entire structure
   */
  private handleFunnelStatUpdated(data: any): void {
    const { funnelId, statLeadCount } = data;

    if (!funnelId) return;

    let updated = false;

    // Update in all folders
    this.folders = this.folders.map(folder => {
      if (folder.type === 'folder' && folder.children) {
        // Update children
        folder.children = folder.children.map(child => {
          if (child.id === funnelId) {
            updated = true;
            return {
              ...child,
              statLeadCount: statLeadCount,
              funnels: child.funnels ? child.funnels.map(f => ({
                ...f,
                statLeadCount: statLeadCount
              })) : child.funnels
            };
          }
          return child;
        });
      } else if (folder.type === 'funnel' && folder.id === funnelId) {
        // Update direct funnel
        updated = true;
        return {
          ...folder,
          statLeadCount: statLeadCount,
          funnels: folder.funnels ? folder.funnels.map(f => ({
            ...f,
            statLeadCount: statLeadCount
          })) : folder.funnels
        };
      }
      return folder;
    });

    if (updated) {
      // Trigger change detection
      this.folders = [...this.folders];
      console.log(`Updated statLeadCount for funnel ${funnelId}: ${statLeadCount}`);
    }
  }

  /**
   * Handle funnel lead count update from socket
   * Updates statLeadCount for specific funnel based on lead/UPDATED_FUNNEL_LEAD_COUNT event
   */
  private handleFunnelLeadCountUpdated(data: any): void {
    const { bizId, funnelId, statLeadCount } = data;

    if (!funnelId) return;

    let updated = false;

    // Update in all folders
    this.folders = this.folders.map(folder => {
      if (folder.type === 'folder' && folder.children) {
        // Update children
        folder.children = folder.children.map(child => {
          if (child.id === funnelId) {
            updated = true;
            return {
              ...child,
              statLeadCount: statLeadCount,
              funnels: child.funnels ? child.funnels.map(f => ({
                ...f,
                statLeadCount: statLeadCount
              })) : child.funnels
            };
          }
          return child;
        });
      } else if (folder.type === 'funnel' && folder.id === funnelId) {
        // Update direct funnel
        updated = true;
        return {
          ...folder,
          statLeadCount: statLeadCount,
          funnels: folder.funnels ? folder.funnels.map(f => ({
            ...f,
            statLeadCount: statLeadCount
          })) : folder.funnels
        };
      }
      return folder;
    });

    if (updated) {
      // Trigger change detection
      this.folders = [...this.folders];
      console.log(`Updated funnel lead count for funnel ${funnelId}: ${statLeadCount}`);
    }
  }

  onDocumentClick() {
    this.closeContextMenu();
    this.showAddDropdown = false;
  }

  toggleDropdown() {
    this.showAddDropdown = !this.showAddDropdown;
  }

  handleDropdownAction(action: string) {
    this.showAddDropdown = false;
    
    switch (action) {
      case 'add-funnel':
        this.addFunnelClick.emit();
        break;
      case 'add-folder':
        this.addNewFolder();
        break;
      case 'show-hidden':
        this.showHiddenLeads();
        break;
    }
  }

  addNewFolder() {
    const folderName = prompt('Nhập tên thư mục mới:');
    if (folderName && folderName.trim()) {
      this.loading = true;
      this.autoTaskService.leadFolder.create({ name: folderName.trim() }).subscribe({
        next: (response) => {
          if (response?.status === 200 || response?.status === 201) {
            console.log('Created folder successfully');

            // Reload folders (need server data like id)
            this.loadFoldersWithFunnels(true);
            
            // Mark this as a local action to ignore socket event
            this.markLocalAction();
            
            this.toastrService.success('Tạo thư mục thành công');
          } else {
            this.loading = false;
            this.toastrService.error('Có lỗi xảy ra khi tạo thư mục. Vui lòng thử lại.');
          }
        },
        error: (error) => {
          console.error('Error creating folder:', error);
          this.loading = false;
          this.toastrService.error('Có lỗi xảy ra khi tạo thư mục. Vui lòng thử lại.');
        }
      });
    }
  }

  showHiddenLeads() {
    if (confirm('Bạn có chắc chắn muốn hiển thị tất cả phễu đã ẩn?')) {
      this.loading = true;
      this.autoTaskService.leadFunnel.unhideAll().subscribe({
        next: (response) => {
          if (response?.status === 200) {
            this.toastrService.success('Hiển thị tất cả phễu ẩn thành công');

            // Reload to show unhidden funnels
            this.loadFoldersWithFunnels(true);

            // Notify other components about funnel data changes
            this.autoTaskService.notifyFunnelDataChanged();

            // Mark this as a local action to ignore socket event
            this.markLocalAction();

            this.loading = false;
          } else {
            this.toastrService.error('Có lỗi xảy ra khi hiển thị phễu. Vui lòng thử lại.');
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error unhiding all funnels:', error);
          this.toastrService.error('Có lỗi xảy ra khi hiển thị phễu. Vui lòng thử lại.');
          this.loading = false;
        }
      });
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onSearchFunnelEvent(event: any) {
    const query = event.target.value?.trim() || '';
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        if (query.length === 0) {
          // If search is empty, show all folders
          this.searchResults = [];
          this.isSearching = false;
        } else {
          // Search funnels via API
          this.searchFunnels(query);
        }
      });
  }

  private searchFunnels(query: string): void {
    this.isSearching = true;

    this.autoTaskService.leadFunnel.get({
      q: query,
      limit: 50 // Limit search results
    }).subscribe({
      next: (response) => {
        if (response?.status === 200 && response.data) {
          this.searchResults = response.data;
        } else {
          this.searchResults = [];
        }
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching funnels:', error);
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  selectFunnelFromSearch(funnel: any): void {
    // Convert funnel to folder format for compatibility with existing selection logic
    const funnelFolder: ILeadFolder = {
      id: funnel.id,
      name: funnel.name,
      type: 'funnel',
      isExpanded: false,
      isPinned: funnel.isPinned || false,
      isSystem: false,
      isEmpty: false
    };

    this.selectedFolder = funnelFolder;
    this.folderSelected.emit(funnelFolder);

    // Clear search results after selection
    this.searchQuery = '';
    this.searchResults = [];
  }

  /**
   * Handle hard refresh: clear cache and reload folders/funnels with fresh API call
   */
  handleHardRefresh(): void {
    if (this.loading) return; // Prevent multiple simultaneous refreshes

    this.loading = true;
    // this.toastrService.info('Đang làm mới dữ liệu phễu và thư mục...');

    // Reload folders with funnels
    this.loadFoldersWithFunnels(true, true);

    // Notify dashboard component to refresh leads data
    this.autoTaskService.notifyFunnelDataChanged();

    // Reset loading state after a short delay and emit completion event
    setTimeout(() => {
      this.loading = false;
      this.toastrService.success('Đã làm mới dữ liệu phễu và thư mục thành công');
      this.hardRefreshCompleted.emit();
    }, 1000);
  }

  /**
   * Mark that a local action just happened (to prevent socket event conflicts)
   */
  private markLocalAction(): void {
    this.lastLocalActionTime = Date.now();
  }

  /**
   * Check if there was a recent local action (within debounce window)
   */
  private isRecentLocalAction(): boolean {
    const timeSinceLastAction = Date.now() - this.lastLocalActionTime;
    return timeSinceLastAction < this.LOCAL_ACTION_DEBOUNCE_MS;
  }

  /**
   * Remove funnel from local state immediately (for optimistic UI update)
   */
  private removeFunnelFromLocalState(funnelId: string): void {
    // Remove funnel from all folders
    this.folders = this.folders.map(folder => {
      if (folder.type === 'folder' && folder.children) {
        // Filter out the deleted funnel from children
        folder.children = folder.children.filter(child => child.id !== funnelId);
      }
      return folder;
    }).filter(folder => {
      // Keep all folders except direct funnel items with matching id
      if (folder.type === 'funnel' && folder.id === funnelId) {
        return false;
      }
      return true;
    });

    // If deleted funnel was selected, clear selection
    if (this.selectedFolder?.id === funnelId) {
      this.selectedFolder = undefined;
    }

    // Trigger change detection
    this.folders = [...this.folders];
  }

  /**
   * Auto-select first funnel from folders
   * Priority: First funnel in Pinned folder -> First funnel in first non-pinned folder
   */
  private autoSelectFirstFunnel(): void {
    // Find Pinned folder
    const pinnedFolder = this.folders.find(f => f.id === 'pinned');
    
    // If Pinned folder has funnels, select the first one
    if (pinnedFolder && pinnedFolder.children && pinnedFolder.children.length > 0) {
      const firstPinnedFunnel = pinnedFolder.children[0];
      this.selectFolder(firstPinnedFunnel);
      this.foldersLoaded.emit();
      return;
    }

    // Otherwise, find first funnel in first non-pinned folder
    for (const folder of this.folders) {
      if (folder.id !== 'pinned' && folder.type === 'folder' && folder.children && folder.children.length > 0) {
        const firstFunnel = folder.children[0];
        this.selectFolder(firstFunnel);
        this.foldersLoaded.emit();
        return;
      }
    }

    // No funnels found - emit event so dashboard can load leads without funnel filter
    this.foldersLoaded.emit();
  }
}
