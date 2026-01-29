import {Component, OnDestroy, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {DEFAULT_LEAD_TABS, DEFAULT_TASK_TABS} from './tab-display.variable';
import {ISetting, ISettingTabItem} from '@app/types/setting';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalCreateUpdateTabComponent} from './content-modal/modal-create-update-tab/modal-create-update-tab.component';
import {v4 as uuidv4} from 'uuid';
import {ToastrService} from 'ngx-toastr';
import {finalize, Subject, takeUntil} from 'rxjs';
import {isEmpty} from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';

enum ETabDisplayTab {
  LEAD = 'LEAD',
  TASK = 'TASK',
}

@Component({
  selector: 'app-tab-display',
  templateUrl: './tab-display.component.html',
  styleUrls: ['./tab-display.component.scss'],
})
export class TabDisplayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public tabs = [
    {
      key: ETabDisplayTab.TASK,
      name: 'Màn hình chi tiết tác vụ',
      fragment: 'TASK',
    },
    {
      key: ETabDisplayTab.LEAD,
      name: 'Màn hình chi tiết lead',
      fragment: 'LEAD',
    },
  ];
  public activeTab: ETabDisplayTab = ETabDisplayTab.TASK;
  protected readonly ETabDisplayTab = ETabDisplayTab;

  public leadTabs: ISettingTabItem[] = [];
  public taskTabs: ISettingTabItem[] = [];

  public configButtons: IFilterTopButton[] = [
    {
      name: 'save',
      type: ETypeButton.PRIMARY,
      label: 'Lưu',
      iconAwesome: 'fas fa-save',
    },
  ];
  public configButtonsAddTab: IFilterTopButton[] = [
    {
      name: 'add_tab',
      type: ETypeButton.PRIMARY,
      label: 'Thêm tab',
      icon: './assets/images/icon-plus-bold.svg',
      tooltip: 'Thêm tab',
    },
  ];

  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly modalConfirmService: ModalConfirmService,
  ) {}

  ngOnInit(): void {
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe((fragment) => {
      if (fragment === 'TASK') {
        this.activeTab = ETabDisplayTab.TASK;
      } else if (fragment === 'LEAD') {
        this.activeTab = ETabDisplayTab.LEAD;
      }
    });

    this.selectTab(this.activeTab);

    this.autoTaskService.currentSetting.subscribe({
      next: (res) => {
        if (res) {
          this.leadTabs = res.leadTabs.map((tab) => {
            if (tab.isDefault) {
              const defaultTab = DEFAULT_LEAD_TABS.find(
                (t) => t.key === tab.key,
              );

              if (defaultTab) {
                return {
                  ...defaultTab,
                  active: tab.active,
                  positions: tab.positions,
                };
              }

              return tab;
            }
            return tab;
          });

          this.taskTabs = res.taskTabs.map((tab) => {
            if (tab.isDefault) {
              const defaultTab = DEFAULT_TASK_TABS.find(
                (t) => t.key === tab.key,
              );

              if (defaultTab) {
                return {
                  ...defaultTab,
                  active: tab.active,
                  positions: tab.positions,
                };
              }

              return tab;
            }
            return tab;
          });

          const leadTabsSet = new Set(this.leadTabs.map((tab) => tab.key));
          const taskTabsSet = new Set(this.taskTabs.map((tab) => tab.key));
          const defaultTaskTabs = DEFAULT_TASK_TABS.filter(
            (tab) => !taskTabsSet.has(tab.key),
          );
          const defaultLeadTabs = DEFAULT_LEAD_TABS.filter(
            (tab) => !leadTabsSet.has(tab.key),
          );
          this.leadTabs = [...defaultLeadTabs, ...this.leadTabs];
          this.taskTabs = [...defaultTaskTabs, ...this.taskTabs];
        }

        if (isEmpty(this.leadTabs)) {
          this.leadTabs = DEFAULT_LEAD_TABS;
        }
        if (isEmpty(this.taskTabs)) {
          this.taskTabs = DEFAULT_TASK_TABS;
        }
      },
    });
  }

  selectTab(tab: ETabDisplayTab) {
    this.activeTab = tab;

    const fragment = this.tabs.find((t) => t.key === tab)?.fragment;
    if (fragment) {
      this.router.navigate([], {
        relativeTo: this.route,
        fragment: fragment,
        replaceUrl: true,
      });
    }
  }

  handleAction(name: string) {
    if (name === 'save') {
      this.configButtons.find((btn) => btn.name === name)!.disabled = true;
      this.autoTaskService.setting
        .update({
          leadTabs: this.leadTabs,
          taskTabs: this.taskTabs,
        } as ISetting)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.configButtons.find((btn) => btn.name === name)!.disabled =
              false;
          }),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.toastr.success('Lưu thành công');
              this.autoTaskService.setCurrentSetting(res.data);
            }
          },
          error: (err) => {
            this.toastr.error('Lưu thất bại');
          },
        });
    } else if (name === 'add_tab') {
      this.createUpdateTab();
    }
  }

  public dropLeadTab(event: CdkDragDrop<ISettingTabItem[]>): void {
    moveItemInArray(this.leadTabs, event.previousIndex, event.currentIndex);
  }

  public dropTaskTab(event: CdkDragDrop<ISettingTabItem[]>): void {
    moveItemInArray(this.taskTabs, event.previousIndex, event.currentIndex);
  }

  public toggleTabVisibility(tab: ISettingTabItem): void {
    tab.active = !tab.active;
  }

  public createUpdateTab(tab: ISettingTabItem | null = null): void {
    const modalRef = this.modalService.show(ModalCreateUpdateTabComponent, {
      class: 'modal-dialog-centered modal-md',
      initialState: {
        tabData: tab,
      },
    });

    if (modalRef.content) {
      (modalRef.content as any).tabData = {...tab};
    }

    modalRef.content?.saveEvent?.subscribe((data: any) => {
      const targetTabs =
        this.activeTab === ETabDisplayTab.LEAD ? this.leadTabs : this.taskTabs;

      if (tab) {
        // Edit existing tab
        const updatedTab: ISettingTabItem = {
          ...tab,
          key: data.key || tab.key,
          name: data.name,
          active: data.isActive,
          url: data.url,
          params:
            data.parameters?.map((param: {argKey: string; argRef: string}) => ({
              key: param.argRef,
              value: param.argKey,
            })) || [],
          icon: data.icon,
        } as any;

        const index = targetTabs.findIndex((t) => t.key === tab.key);
        if (index !== -1) {
          targetTabs[index] = updatedTab;
        }
      } else {
        // Create new tab
        const newTab: ISettingTabItem = {
          key: data.key || `iframe_${uuidv4()}`,
          name: data.name,
          active: data.isActive,
          position: 'left',
          url: data.url,
          params:
            data.parameters?.map((param: {argKey: string; argRef: string}) => ({
              key: param.argRef,
              value: param.argKey,
            })) || [],
          icon: data.icon,
        } as any;

        targetTabs.push(newTab);
      }

      this.handleAction('save');
    });
  }

  handleDeleteTab(tab: ISettingTabItem) {
    const title = 'Xóa Tab';
    const description = `Bạn sắp xóa Tab <b>${
      tab.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: tab,
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteTab(tab);
    });
  }

  public deleteTab(tab: ISettingTabItem): void {
    if (tab.isDefault) {
      this.toastr.warning('Không thể xóa tab mặc định');
      return;
    }

    const targetTabs =
      this.activeTab === ETabDisplayTab.LEAD ? this.leadTabs : this.taskTabs;
    const index = targetTabs.findIndex((t) => t.key === tab.key);
    if (index !== -1) {
      targetTabs.splice(index, 1);
      this.toastr.success('Xóa tab thành công');
    }
  }

  public getTabsByPosition(position: 'left' | 'right'): ISettingTabItem[] {
    const targetTabs =
      this.activeTab === ETabDisplayTab.LEAD ? this.leadTabs : this.taskTabs;
    return targetTabs.filter(
      (tab) => tab.active && tab.positions?.includes(position),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
