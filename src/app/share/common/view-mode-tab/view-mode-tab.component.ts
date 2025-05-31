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
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabDirective, TabsetComponent, TabsModule } from 'ngx-bootstrap/tabs';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ToastrService } from 'ngx-toastr';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import {
  IModalConfirmContent,
  ModalConfirmComponent,
} from '@share/custom/modal-confirm/modal-confirm.component';
import { ModalConfirmService } from '@share/custom/modal-confirm/modal-confirm.service';
import { EScreens, IViewDto, IViewModeDto } from '@app/types/setting';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { CommonService } from '@app/services/common/common.service';
import { v4 as uuidv4 } from 'uuid';
import cloneDeep from 'lodash/cloneDeep';
import { TreeSelectModule } from 'primeng/treeselect';
import { ModifiedUserUnit } from '@app/types/flow';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { BizRole, User } from '@app/types/viewmodels';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { FilterDataModule } from '@app/share/pipe/filter-data/filter-data.module';
import { CustomModalComponent } from '../../custom/custom-modal/custom-modal.component';
import { BaseComponentsComponent } from '../base-components/base-components.component';
import { CustomInputSearchComponent } from "../../custom/custom-input-search/custom-input-search.component";

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
    CustomInputSearchComponent
  ],
  templateUrl: './view-mode-tab.component.html',
  styleUrls: ['./view-mode-tab.component.scss'],
})
export class ViewModeTabComponent
  extends BaseComponentsComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('staticTabs') staticTabs!: TabsetComponent;
  @ViewChild('viewSettingsModal') viewSettingsModal!: TemplateRef<void>;

  @Input() MAX_TAB = 15;
  @Input() key?: EScreens;
  @Input() quantity = 0;
  @Input() isActiveChangeTab: Boolean = true;

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

  public modeTypes = [
    { label: 'Cá nhân', value: 'personal' },
    { label: 'Chi nhánh', value: 'position' },
    { label: 'Vai trò', value: 'role', role: 'OWNER' },
    { label: 'Tất cả', value: 'all', role: 'OWNER' },
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
          }, 100);
        });
    }
  }

  ngOnChanges(changes: SimpleChanges) { }

  handleOpenPopover(event: any) {
    this.filteredTabs = this.tabs;
  }

  onSearch(term: string) {
    this.filteredTabs = this.tabs.filter(
      (tab) => tab.name && tab.name.toLowerCase().includes(term.toLowerCase()),
    );
  }

  ngAfterViewInit() {
    this.checkHideButtonNext();
  }

  modifyTabs(tabs: IViewModeDto[], isInit: boolean = false) {
    const modifiedTabs = tabs.map((tab) => {
      return {
        ...tab,
        id: uuidv4(),
        options: tab.options ?? {},
        isEdit: false,
        hasChanged: false,
        isActive: tab.isDefault ?? false,
        ownerId: tab.ownerId,
        type: tab.type || 'personal',
        allowedUserIds: tab.allowedUserIds || [],
        posIds: tab.posIds || [],
        roleIds: tab.roleIds || [],
      };
    });
    if (isInit) {
      this.autoTaskService.setCurrentActiveViewMode(
        this.autoTaskService.getCurrentActiveViewMode() || modifiedTabs[0],
      );
    }
    return modifiedTabs;
  }

  handleGetTab() {
    this.loading = true;
    this.autoTaskService.settingView
      .retrieve(
        {
          screen: this.key,
        },
        { cache: true },
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const tabs = this.modifyTabs(res.data.modes, true);
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
    const { scrollWidth, clientWidth, scrollLeft } = scrollTab;
    if (scrollTab?.scrollLeft === 0) {
      if (buttonPrev) {
        buttonPrev.classList.add('hide');
      }
    } else {
      if (buttonPrev) {
        buttonPrev.classList.remove('hide');
      }
    }

    if (scrollWidth > 0 && scrollWidth - scrollLeft === clientWidth) {
      if (buttonNext) {
        buttonNext.classList.add('hide');
      }
    } else {
      if (buttonNext) {
        buttonNext.classList.remove('hide');
      }
    }
  }

  handleChangeActive(tab: IViewModeDto, index: number, isScroll: boolean = false,) {
    if (!this.isActiveChangeTab) return;
    this.tabs.forEach((item) => {
      item.isActive = false;
    });
    tab.isActive = true;
    if (isScroll) {
      // scroll to active tab
      const scrollTab = document.querySelector('.nav-tabs');
      if (scrollTab) {
        const activeTab = document.getElementById(`view-mode-id-${tab.id}-link`);
        if (activeTab) {
          scrollTab.scrollLeft = activeTab.offsetLeft;
          setTimeout(() => {
            this.checkHideButtonNext();
          }, 1000);
        }
      }
    }
    this.autoTaskService.setCurrentActiveViewMode(tab, true);
  }

  handleUpdateTab(tab: IViewModeDto) {
    tab.isEdit = false;
    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    const index = oldViewModes.findIndex((item) => item.id === tab.id);
    if (index !== -1) {
      oldViewModes[index] = tab;
    }
    this.autoTaskService.setDashboardViewModes(oldViewModes);
    this.autoTaskService.setCurrentActiveViewMode(tab);
    this.handleSetTab().then();
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
        scrollTab.scrollLeft -= 500;
      } else {
        scrollTab.scrollLeft += 500;
      }
      setTimeout(() => {
        this.checkHideButtonNext();
      }, 500);
    }
  }

  handleEditTab(tab: IViewModeDto, event: any, index: number) {
    tab.isEdit = true;
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
    if (this.tabs.length >= this.MAX_TAB) {
      this.toastr.warning(`Tối đa ${this.MAX_TAB} chế độ xem`);
      return;
    }
    const newTab = {
      id: uuidv4(),
      name: tab.name,
      isEdit: false,
      isActive: false,
      options: tab.options,
      ownerId: this.currentUser?.id,
      type: this.currentUser?.role === 'OWNER' ? 'all' : 'personal',
    } as IViewModeDto;
    this.tabs.push(newTab);
    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    this.autoTaskService.setDashboardViewModes([...oldViewModes, newTab]);
    this.handleSetTab().then();
    this.checkHideButtonNext();
  }

  handleDeleteViewMode(value: IViewModeDto) {
    const title = 'Xóa chế độ xem';
    const description = `Bạn sắp xóa chế độ xem <b>${value.name || ''
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
      this.removeTabHandler(value);
    });
  }

  removeTabHandler(tab: IViewModeDto): void {
    let index = this.tabs.indexOf(tab);
    if (index === -1) {
      return;
    }
    if (tab.isActive && this.hasAvailableTabs(index)) {
      let newActiveIndex = this.getClosestTabIndex(index);
      this.tabs[newActiveIndex].isActive = true;
    } else {
      this.tabs[index].isActive = false;
      this.staticTabs.tabs[0].active = true;
    }
    this.tabs.splice(index, 1);
    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    this.autoTaskService.setDashboardViewModes(
      oldViewModes.filter((item) => item.id !== tab.id),
    );
    this.handleSetTab().then();
  }

  handleSetTab() {
    this.loading = true;
    const tabs = this.autoTaskService.getDashboardViewModes();
    return new Promise((resolve, reject) => {
      this.autoTaskService.settingView
        .update({
          screen: this.key as EScreens,
          modes: tabs
            .map((tab) => {
              return {
                name: tab.name,
                options: tab.options,
                isDefault: tab.isDefault,
                type: tab.type,
                allowedUserIds: tab.allowedUserIds,
                posIds: tab.posIds,
                ownerId: tab.ownerId,
                roleIds: tab.roleIds,
              };
            })
            .filter((item) => item.ownerId === this.currentUser?.id),
        } as IViewDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.checkHideButtonNext();
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

  addNewTab(): void {
    if (this.tabs.length >= this.MAX_TAB) {
      this.toastr.warning(`Tối đa ${this.MAX_TAB} chế độ xem`);
      return;
    }
    const scrollTab = document.querySelector('.nav-tabs');
    if (scrollTab) {
      scrollTab.scrollLeft = scrollTab.scrollWidth - scrollTab.clientWidth;
    }
    const newTabIndex = this.tabs.length + 1;
    const newTab = {
      id: uuidv4(),
      name: `Chế độ xem ${newTabIndex}`,
      isEdit: false,
      isActive: false,
      options: {},
      ownerId: this.currentUser?.id,
      type: this.currentUser?.role === 'OWNER' ? 'all' : 'personal',
    } as IViewModeDto;
    this.tabs.push(newTab);
    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    this.autoTaskService.setDashboardViewModes([...oldViewModes, newTab]);
    this.handleSetTab().then();
    this.checkHideButtonNext();
  }

  async handleSave(tab: IViewModeDto, isConfirm: boolean) {
    if (isConfirm) {
      //find and update tab into dashboardViewModes
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
      // update tab by data find from dashboardViewModes
      try {
        const tabs = this.autoTaskService.getDashboardViewModes();
        const index = tabs.findIndex((item) => item.id === tab.id);
        if (index !== -1) {
          tab = this.tabs[index] = cloneDeep(tabs[index]);
        }
        tab.hasChanged = false;
        this.autoTaskService.setCurrentActiveViewMode(tabs[index]);
      } catch (e) {
        console.log(e);
      }
    }
  }

  trackByMethod(index: number, el: any): number {
    return el.id;
  }

  handleSettingsViewMode(tab: IViewModeDto): void {
    this.selectedTab = { ...tab };

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
    }

    const oldViewModes = this.autoTaskService.getDashboardViewModes();
    const index = oldViewModes.findIndex(
      (item) => item.id === this.selectedTab?.id,
    );
    if (index !== -1) {
      oldViewModes[index] = this.selectedTab;
    }

    this.tabs = cloneDeep(oldViewModes);
    this.tabs.forEach((tab) => {
      tab.isActive = tab.id === this.selectedTab?.id;
    });

    this.handleSetTab()
      .then(() => {
        this.modalRef?.hide();
        this.toastr.success('Cập nhật chế độ xem thành công');
      })
      .catch((err) => {
        this.toastr.error('Cập nhật chế độ xem thất bại');
        console.error(err);
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
}
