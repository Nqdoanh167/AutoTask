import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TabsetComponent, TabsModule} from 'ngx-bootstrap/tabs';
import {finalize, takeUntil} from 'rxjs';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {ToastrService} from 'ngx-toastr';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {EScreens, IViewDto, IViewModeDto} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {v4 as uuidv4} from 'uuid';
import cloneDeep from 'lodash/cloneDeep';
import {TreeSelectModule} from 'primeng/treeselect';
import {ModifiedUserUnit} from '@app/types/flow';
import {BsModalRef, BsModalService, ModalModule} from 'ngx-bootstrap/modal';
import {BizRole, User} from '@app/types/viewmodels';
import {NgSelectModule} from '@ng-select/ng-select';
import {FilterDataModule} from '@app/share/pipe/filter-data/filter-data.module';
import {CustomModalComponent} from '../../custom/custom-modal/custom-modal.component';
import {BaseComponentsComponent} from '../base-components/base-components.component';
import {CustomInputSearchComponent} from '../../custom/custom-input-search/custom-input-search.component';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {calculateNextPos} from '@app/utils/common';

@Component({
  selector: 'app-view-mode-tab',
  standalone: true,
  imports: [
    CommonModule,
    BsDropdownModule,
    ReactiveFormsModule,
    TabsModule,
    FormsModule,
    PopoverModule,
    TooltipModule,
    TreeSelectModule,
    ModalModule,
    NgSelectModule,
    FilterDataModule,
    CustomModalComponent,
    CustomInputSearchComponent,
    DragDropModule,
  ],
  templateUrl: './view-mode-tab.component.html',
  styleUrls: ['./view-mode-tab.component.scss'],
})
export class ViewModeTabComponent
  extends BaseComponentsComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @ViewChild('staticTabs') staticTabs!: TabsetComponent;
  @ViewChild('viewSettingsModal') viewSettingsModal!: TemplateRef<void>;
  @ViewChild('colorPickerModal') colorPickerModal!: TemplateRef<void>;

  @Input() MAX_TAB = 15;
  @Input() key?: EScreens;
  @Input() quantity = 0;
  @Input() isActiveChangeTab: Boolean = true;
  @Input() checkbox: any;

  public tabs: IViewModeDto[] = [];
  public filteredTabs: IViewModeDto[] = [];
  public loading = false;
  public selectedUsers: User[] = [];
  public selectedUserIds: string[] = [];
  public roles: BizRole[] = [];
  public units = this.autoTaskService.getUserUnits(false);
  public selectedUnits: ModifiedUserUnit[] = [];
  public branches: any[] = [];

  public selectedTab?: IViewModeDto;
  public selectedTabForColor?: IViewModeDto;
  public currentColorForTab: string = '#fa0000';

  public modeTypes = [
    {label: 'Cá nhân', value: 'personal'},
    {label: 'Chi nhánh', value: 'position', role: 'OWNER'},
    {label: 'Vai trò', value: 'role', role: 'OWNER'},
    {label: 'Tất cả', value: 'all', role: 'OWNER'},
  ];

  public colorList: string[] = [
    '#2C2C2B',
    '#7D7A75',
    '#9F765A',
    '#D27B2D',
    '#CB9434',
    '#50946E',
    '#387DC9',
    '#9A6BB4',
    '#C14C8A',
    '#EB6553',
    '#FFB800',
    '#3AC34C',
    '#4277FF',
  ];
  constructor(
    private readonly toastr: ToastrService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly modalService: BsModalService,
    public modalRef: BsModalRef,
  ) {
    super();
    this.roles = this.currentUser?.roles || [];
  }

  ngOnInit() {
    if (this.key) {
      this.handleGetTab();
      this.autoTaskService.changedDashboardViewModes
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.tabs = res;
          setTimeout(() => {
            this.checkHideButtonNext();
            this.applyTabViewColor();
          }, 100);
        });
    }
  }

  ngOnChanges(changes: SimpleChanges) {}

  getUserById(id: string | undefined): User | undefined {
    return this.bizUsers?.find((user) => user.id === id);
  }

  handleOpenPopover(event: any) {
    event.stopPropagation();
    this.filteredTabs = this.tabs;
  }

  onSearch(term: string) {
    this.filteredTabs = this.tabs.filter(
      (tab) => tab.name && tab.name.toLowerCase().includes(term.toLowerCase()),
    );
  }

  ngAfterViewInit() {
    this.checkHideButtonNext();
    this.applyTabViewColor();
  }

  modifyTabs(tabs: IViewModeDto[], isInit: boolean = false) {
    const modifiedTabs = tabs.map((tab, index) => {
      return {
        ...tab,
        options: tab.options ?? {},
        isEdit: tab.isEdit,
        hasChanged: false,
        isActive: index === 0,
        ownerId: tab.ownerId,
        type: tab.type || 'personal',
        allowedUserIds: tab.allowedUserIds || [],
        posIds: tab.posIds || [],
        roleIds: tab.roleIds || [],
        isRename: false,
        isEditView: tab.isEdit || tab.ownerId === this.currentUser?.id,
        pos: tab.pos,
      };
    });

    if (isInit) {
      let currentTab = modifiedTabs.find((tab) => tab.isActive);
      if (!currentTab) {
        currentTab = modifiedTabs[0];
      }
      if (currentTab) {
        // currentTab.isDefault = true;
        currentTab.isActive = true;
        this.autoTaskService.setCurrentActiveViewMode(currentTab, true);
      }
    }
    return modifiedTabs;
  }

  handleGetTab(isCache: boolean = true) {
    this.loading = true;
    this.autoTaskService.settingView
      .retrieve(
        {
          screen: this.key,
        },
        {cache: isCache},
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const tabs = this.modifyTabs(res.data, true);
            this.autoTaskService.setDashboardViewModes(tabs);
            this.autoTaskService.setChangedDashboardViewModes(cloneDeep(tabs));
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  checkHideButtonNext() {
    const scrollTab = document.querySelector('.nav-tabs');
    const buttonPrev = document.querySelector('.button-previous');
    const buttonNext = document.querySelector('.button-next');
    if (!scrollTab) return;
    const {scrollWidth, clientWidth, scrollLeft} = scrollTab;
    if (scrollTab?.scrollLeft === 0) {
      if (buttonPrev) {
        buttonPrev.classList.add('hide');
      }
    } else {
      if (buttonPrev) {
        buttonPrev.classList.remove('hide');
      }
    }

    if (
      scrollWidth > 0 &&
      scrollWidth - Math.trunc(scrollLeft) === clientWidth
    ) {
      if (buttonNext) {
        buttonNext.classList.add('hide');
      }
    } else {
      if (buttonNext) {
        buttonNext.classList.remove('hide');
      }
    }
  }

  handleChangeActive(
    tab: IViewModeDto,
    index: number,
    isScroll: boolean = false,
  ) {
    this.tabs.forEach((item) => {
      item.isActive = false;
    });
    tab.isActive = true;
    if (isScroll) {
      // scroll to active tab
      const scrollTab = document.querySelector('.nav-tabs');
      if (scrollTab) {
        const activeTab = document.getElementById(
          `view-mode-id-${tab.id}-link`,
        );
        if (activeTab) {
          scrollTab.scrollLeft = activeTab.offsetLeft - 300;
          setTimeout(() => {
            this.checkHideButtonNext();
          }, 1000);
        }
      }
    }
    this.autoTaskService.setCurrentActiveViewMode(tab, true);
  }

  handleUpdateTab(tab: IViewModeDto) {
    if (!tab) return;
    this.autoTaskService.settingView
      .update({
        screen: this.key!,
        ...tab,
        name: tab.name!,
      })
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            tab.isRename = false;
            this.toastr.success('Cập nhật tab thành công');
          } else {
            this.toastr.error('Cập nhật tab thất bại');
          }
        },
        error: (err) => {
          this.toastr.error('Cập nhật tab thất bại');
        },
      });
  }

  handleKeyDown(event: any, tab: IViewModeDto) {
    event.stopPropagation();
    if (event.key === 'Enter') {
      this.handleUpdateTab(tab);
    }
  }

  handleScrollTab(type: 'prev' | 'next') {
    const scrollTab = document.querySelector('.nav-tabs');
    if (scrollTab) {
      if (type === 'prev') {
        scrollTab.scrollLeft = 0;
      } else {
        scrollTab.scrollLeft = scrollTab.scrollWidth;
      }
      setTimeout(() => {
        this.checkHideButtonNext();
      }, 500);
    }
  }

  handleEditTab(tab: IViewModeDto, event: any, index: number) {
    event.stopPropagation();
    if (!tab.isEditView) {
      return;
    }
    tab.isRename = true;
    setTimeout(() => {
      const inputEdit = document.getElementById(`input-edit-tab-${index}`);
      if (inputEdit) {
        inputEdit.focus();
      }
    }, 0);
  }

  hasAvailableTabs(index: number): boolean {
    const tabsLength = this.tabs.length;
    if (!tabsLength) {
      return false;
    }
    if (this.tabs[index].isActive && tabsLength > 1) {
      return true;
    }
    return !this.tabs[index].isActive && tabsLength > 1;
  }

  getClosestTabIndex(index: number): number {
    const tabsLength = this.tabs.length;
    if (!tabsLength) {
      return -1;
    }
    for (let step = 1; step <= tabsLength; step += 1) {
      const prevIndex = index - step;
      const nextIndex = index + step;
      if (this.tabs[prevIndex] && !this.tabs[prevIndex].isActive) {
        return prevIndex;
      }
      if (this.tabs[nextIndex] && !this.tabs[nextIndex].isActive) {
        return nextIndex;
      }
    }
    return -1;
  }

  handleCloneTab(tab: IViewModeDto, event: any) {
    event.stopPropagation();
    // if (this.tabs.length >= this.MAX_TAB) {
    //   this.toastr.warning(`Tối đa ${this.MAX_TAB} chế độ xem`);
    //   return;
    // }
    const newTab = {
      id: uuidv4(),
      name: tab.name,
      isEdit: false,
      isActive: false,
      options: tab.options,
      ownerId: this.currentUser?.id,
      type: 'personal',
    } as IViewModeDto;
    this.tabs.push(newTab);
    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    this.autoTaskService.setDashboardViewModes([...oldViewModes, newTab]);
    this.handleSetTab().then();
    this.checkHideButtonNext();
  }

  handleDeleteViewMode(value: IViewModeDto, event: any, index: number) {
    event.stopPropagation();
    const title = 'Xóa chế độ xem';
    const description = `Bạn sắp xóa chế độ xem <b>${
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
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.removeTabHandler(value, index);
    });
  }

  removeTabHandler(tab: IViewModeDto, index: number): void {
    this.autoTaskService.settingView.delete(tab.id!).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.tabs = this.tabs.filter((item) => item.id !== tab.id);
          this.autoTaskService.setChangedDashboardViewModes([...this.tabs]);

          if (tab.isActive && this.tabs.length > 0) {
            this.tabs.forEach((item) => (item.isActive = false));
            this.tabs[0].isActive = true;
            this.autoTaskService.setCurrentActiveViewMode(this.tabs[0], true);
          }

          this.toastr.success('Xóa chế độ xem thành công');
        } else {
          this.toastr.error('Xóa chế độ xem thất bại');
        }
      },
      error: (err) => {
        this.toastr.error('Xóa chế độ xem thất bại');
      },
    });
  }

  handleSetTab() {
    this.loading = true;
    const tabs = this.autoTaskService.getDashboardViewModes();
    const tabActive = tabs.find((tab) => tab.isActive);
    return new Promise((resolve, reject) => {
      this.autoTaskService.settingView
        .update({
          id: tabActive?.id,
          screen: this.key,
          name: tabActive?.name,
          isEdit: tabActive?.isEdit,
          isActive: tabActive?.isActive,
          options: tabActive?.options || {},
          type: tabActive?.type || 'personal',
          isDefault: tabActive?.isDefault || false,
          allowedUserIds: tabActive?.allowedUserIds || [],
          posIds: tabActive?.posIds || [],
          roleIds: tabActive?.roleIds || [],
          isRename: tabActive?.isRename || false,
        } as IViewDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.checkHideButtonNext();
              // Cập nhật lại list view mode
              const currentListViewModeSubject =
                this.autoTaskService.getListViewModeSubject();
              const currentListViewModeIdx =
                currentListViewModeSubject.data.findIndex(
                  (item) => item.id === tabActive?.id,
                );
              if (currentListViewModeIdx !== -1)
                currentListViewModeSubject.data[currentListViewModeIdx] =
                  res.data;
              // End cập nhật list view mode
              resolve(true);
            } else {
              this.commonService.handleResErr(res);
              resolve(false);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
            resolve(false);
          },
        });
    });
  }

  addNewAndCloneTab(tab: IViewModeDto | null = null): void {
    // if (this.tabs.length >= this.MAX_TAB) {
    //   this.toastr.warning(`Tối đa ${this.MAX_TAB} chế độ xem`);
    //   return;
    // }
    let newTab: IViewDto;
    if (tab) {
      newTab = {
        screen: this.key!,
        name: tab.name!,
        isEdit: false,
        isActive: false,
        options: tab.options,
        type: 'personal',
        isDefault: false,
        allowedUserIds: tab.allowedUserIds || [],
        posIds: tab.posIds || [],
        roleIds: tab.roleIds || [],
      };
    } else {
      const newTabIndex = this.tabs.length + 1;
      newTab = {
        screen: this.key,
        name: `Chế độ xem ${newTabIndex}`,
        isEdit: false,
        isActive: false,
        options: {},
        ownerId: this.currentUser?.id,
        type: 'personal',
        isDefault: false,
        allowedUserIds: [],
        posIds: [],
        roleIds: [],
      } as IViewDto;
    }

    this.loading = true;
    this.autoTaskService.settingView
      .create(newTab)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tabs.forEach((item) => {
              item.isActive = false;
            });
            const tab = res.data;
            tab.isEditView = true;
            tab.isActive = true;
            this.tabs.push(tab);
            this.autoTaskService.setCurrentActiveViewMode(tab, true);

            setTimeout(() => {
              const tabContainer = document.querySelector('.nav-tabs');
              if (tabContainer) {
                tabContainer.scrollLeft = tabContainer.scrollWidth + 100;
              }

              setTimeout(() => {
                if (tabContainer) {
                  tabContainer.scrollLeft = tabContainer.scrollWidth + 100;
                }
                this.checkHideButtonNext();
              }, 50);

              this.checkHideButtonNext();
            }, 100);

            this.toastr.success('Thêm chế độ xem thành công');
          } else {
            this.toastr.error('Thêm chế độ xem thất bại');
          }
        },
        error: (err) => {
          this.toastr.error('Thêm chế độ xem thất bại');
        },
      });
  }

  async handleSave(tab: IViewModeDto, isConfirm: boolean) {
    if (isConfirm) {
      // Lưu những filter mới vào options của tab
      const tabs = this.autoTaskService.getDashboardViewModes();
      const index = tabs.findIndex((item) => item.id === tab.id);
      if (index !== -1) {
        tabs[index] = tab;
      }
      this.autoTaskService.setDashboardViewModes(this.tabs);
      const res = await this.handleSetTab();
      if (res) {
        tab.hasChanged = false;
      }
    } else {
      // Chỉ xóa những filter mới thêm, giữ nguyên những filter cũ
      try {
        const tabs = this.autoTaskService.getDashboardViewModes();
        const index = tabs.findIndex((item) => item.id === tab.id);
        if (index !== -1) {
          const originalTab = cloneDeep(tabs[index]);
          const originalOptions = originalTab.options || {};
          // Bổ sung thêm branchIds, teamIds, teamRoleIds nếu có
          if (this.checkbox?.branchIds && this.checkbox?.branchIds.length > 0) {
            originalOptions.branchIds = this.checkbox.branchIds;
          }
          if (this.checkbox?.roleIds && this.checkbox?.roleIds.length > 0) {
            originalOptions.teamRoles = this.checkbox.roleIds;
          }
          if (this.checkbox?.userIds && this.checkbox?.userIds.length > 0) {
            originalOptions.teamId = this.checkbox.userIds;
          }

          // Tạo options mới chỉ chứa những filter cũ (có trong originalOptions)
          const filteredOptions: any = {};
          Object.keys(originalOptions).forEach((key) => {
            filteredOptions[key] = originalOptions[key];
          });

          // Cập nhật tab với options đã được lọc
          tab = this.tabs[index] = {
            ...originalTab,
            options: filteredOptions,
          };
        }
        tab.hasChanged = false;
        this.autoTaskService.setCurrentActiveViewMode(tab);
      } catch (e) {
        console.log(e);
      }
    }
  }

  trackByMethod(index: number, item: any): any {
    return index;
  }

  handleSettingsViewMode(tab: IViewModeDto): void {
    if (!this.authService.isOwner()) {
      this.toastr.warning('Bạn không có quyền thực hiện chức năng này');
      return;
    }
    this.selectedTab = {...tab};

    this.selectedUsers = (this.bizUsers || []).filter(
      (user) =>
        this.selectedTab?.allowedUserIds?.includes(user.id) &&
        user.id !== this.currentUser?.id,
    );

    this.selectedUserIds = this.selectedUsers.map((item) => item.id);
    this.selectedUnits = this.autoTaskService.findUnitsByIds(tab.posIds || []);

    this.modalRef = this.modalService.show(this.viewSettingsModal, {
      class: 'modal-dialog-centered',
      backdrop: 'static',
      ignoreBackdropClick: true,
    });

    this.modalRef?.onHidden?.subscribe(() => {
      this.selectedUsers = [];
      this.selectedUserIds = [];
      this.selectedTab = undefined;
    });
  }

  handleChooseUser(user: User) {
    if (user) {
      const existingUser = this.selectedUsers.find(
        (item) => item.id === user.id,
      );
      if (!existingUser) {
        this.selectedUsers.push(user);
      }
    }
    this.selectedUserIds = this.selectedUsers.map((item) => item.id);
  }

  handleRemoveUser(user: User) {
    this.selectedUsers = this.selectedUsers.filter(
      (item) => item.id !== user.id,
    );
    this.selectedUserIds = this.selectedUsers.map((item) => item.id);
  }

  saveViewSettings(): void {
    if (!this.selectedTab) return;
    if (this.selectedTab.type === 'personal') {
      this.selectedTab.allowedUserIds = this.selectedUserIds;
    }

    if (this.selectedTab.type === 'position') {
      this.selectedTab.posIds = this.selectedUnits.map((unit) => {
        return unit.team || unit.department || unit.id || '';
      });

      if (this.selectedTab.posIds.length === 0) {
        this.toastr.warning('Vui lòng chọn ít nhất một chi nhánh');
        return;
      }
    }

    if (this.selectedTab.type === 'role') {
      if (this.selectedTab?.roleIds?.length === 0) {
        this.toastr.warning('Vui lòng chọn ít nhất một vai trò');
        return;
      }
    }

    this.autoTaskService.settingView
      .update({
        id: this.selectedTab.id,
        screen: this.key,
        name: this.selectedTab.name,
        isEdit: this.selectedTab.isEdit,
        options: this.selectedTab.options || {},
        type: this.selectedTab.type || 'personal',
        isDefault: this.selectedTab.isDefault || false,
        allowedUserIds: this.selectedTab.allowedUserIds || [],
        posIds: this.selectedTab.posIds || [],
        roleIds: this.selectedTab.roleIds || [],
      } as IViewDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.modalRef?.hide();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const tab = res.data;
            tab.isActive = true;
            tab.isEditView = true;
            this.toastr.success('Cập nhật chế độ xem thành công');
            this.autoTaskService.setCurrentActiveViewMode(res.data, true);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleChangeUnits(event: any) {
    const ids: string[] = [];
    this.selectedUnits.forEach((unit) => {
      ids.push(unit?.team || unit?.department || unit?.id || '');
    });
  }

  getSelectedSummary(nodes: any[]): string {
    const teamIds = new Set();
    const pbKeys = new Set();
    const cnKeys = new Set();

    nodes.forEach((n) => {
      if (n.team) {
        teamIds.add(n.team); // Đội nhóm: ưu tiên cao nhất
      } else if (n.department) {
        // Nếu chưa chọn TEAM của PB này thì mới đếm PB
        const hasTeam = nodes.some(
          (x) => x.team && x.department === n.department,
        );
        if (!hasTeam) {
          pbKeys.add(`${n.id}-${n.department}`); // Dựa theo id CN + id PB
        }
      } else {
        // Nếu chưa chọn PB hoặc TEAM thuộc CN này thì mới đếm CN
        const hasLowerLevel = nodes.some(
          (x) =>
            (x.department && x.id === n.id) || // có PB trong CN này
            (x.team && x.id === n.id), // có TEAM trong CN này
        );
        if (!hasLowerLevel) {
          cnKeys.add(n.id);
        }
      }
    });

    const parts = [];
    if (cnKeys.size) parts.push(`${cnKeys.size}CN`);
    if (pbKeys.size) parts.push(`${pbKeys.size}PB`);
    if (teamIds.size) parts.push(`${teamIds.size}ĐN`);

    return parts.join(' ');
  }

  //Xác định tab nào di chuyển
  //Nếu đưa lên đầu => pos = tab[0].pos/2
  //Nếu đơn xuống cuối => pos+=tabs[tabs.length-1].pos+1000
  //Còn lại => pos = (tab[index-1].pos + tab[index+1].pos)/2
  //Hãy tính toán pos mới cho tab đã di chuyển
  drop(event: CdkDragDrop<IViewModeDto[]>) {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;
    // Di chuyển item trong mảng filteredTabs
    moveItemInArray(this.filteredTabs, previousIndex, currentIndex);
    const afterMovedPosList = this.filteredTabs.map((item) => item.pos || 0);

    if (previousIndex === currentIndex) return;

    const movedTab = this.filteredTabs[currentIndex];
    if (!movedTab.id || !movedTab.pos === undefined) return;

    // let newPos: number = movedTab.pos! || 0;

    // if (currentIndex === 0) {
    //   const nextTab = this.filteredTabs[1];
    //   newPos = nextTab ? nextTab.pos! / 2 : 0;
    // } else if (currentIndex === this.filteredTabs.length - 1) {
    //   newPos = (this.filteredTabs[currentIndex - 1].pos! || 0) + 1000;
    // } else {
    //   const prevTab = this.filteredTabs[currentIndex - 1];
    //   const nextTab = this.filteredTabs[currentIndex + 1];
    //   newPos = (prevTab.pos! + nextTab.pos!) / 2;
    // }

    const newPos =
      calculateNextPos(afterMovedPosList, currentIndex) || movedTab.pos!;
    movedTab.pos = newPos;

    this.autoTaskService.settingView
      .updatePos(movedTab.id, newPos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.autoTaskService.setChangedDashboardViewModes([
              ...this.filteredTabs,
            ]);
            this.toastr.success('Cập nhật vị trí tab thành công');
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleQuickColorChange(tab: IViewModeDto, color: string, event: any): void {
    event.stopPropagation();
    if (!tab.isEditView) {
      this.toastr.warning('Bạn không có quyền thay đổi màu tab này');
      return;
    }

    this.selectedTabForColor = {...tab};
    this.currentColorForTab = color;

    this.saveTabViewColor();
  }

  handleOpenColorPicker(tab: IViewModeDto, event: any): void {
    event.stopPropagation();
    if (!tab.isEditView) {
      this.toastr.warning('Bạn không có quyền thay đổi màu tab này');
      return;
    }

    this.selectedTabForColor = {...tab};
    this.currentColorForTab = tab.tabViewModeBorderColor || '#fa0000';

    this.modalRef = this.modalService.show(this.colorPickerModal, {
      class: 'modal-dialog-centered modal-sm',
      backdrop: 'static',
      ignoreBackdropClick: true,
    });

    this.modalRef?.onHidden?.subscribe(() => {
      this.selectedTabForColor = undefined;
      this.currentColorForTab = '#fa0000';
    });
  }

  onColorInputChange(event: any): void {
    this.currentColorForTab = event.target.value;
  }

  saveTabViewColor(): void {
    if (!this.selectedTabForColor) return;

    this.autoTaskService.settingView
      .update({
        ...this.selectedTabForColor,
        tabViewModeBorderColor: this.currentColorForTab,
      } as IViewDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.modalRef?.hide();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const tabIndex = this.tabs.findIndex(
              (tab) => tab.id === this.selectedTabForColor!.id,
            );
            if (tabIndex !== -1) {
              this.tabs[tabIndex].tabViewModeBorderColor =
                this.currentColorForTab;
            }

            this.toastr.success('Cập nhật màu tab thành công');
            this.autoTaskService.setChangedDashboardViewModes([...this.tabs]);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleRemoveColor(tab: IViewModeDto, event: any): void {
    event.stopPropagation();
    if (!tab.isEditView) {
      this.toastr.warning('Bạn không có quyền xóa màu tab này');
      return;
    }

    this.autoTaskService.settingView
      .update({
        ...tab,
        tabViewModeBorderColor: '',
      } as IViewDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const tabIndex = this.tabs.findIndex((item) => item.id === tab.id);
            if (tabIndex !== -1) {
              this.tabs[tabIndex].tabViewModeBorderColor = undefined;
            }

            this.toastr.success('Xóa màu tab thành công');
            this.autoTaskService.setChangedDashboardViewModes([...this.tabs]);
            this.applyTabViewColor();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  applyTabViewColor() {
    this.tabs.forEach((tab) => {
      const navLinkTabElement = document.getElementById(
        `view-mode-id-${tab.id}-link`,
      );
      if (navLinkTabElement) {
        navLinkTabElement.style.borderTop = `3px solid ${
          tab.tabViewModeBorderColor || 'transparent'
        }`;
      }
    });
  }
}
