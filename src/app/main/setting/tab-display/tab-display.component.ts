import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LEAD_TABS, TASK_TABS} from './tab-display.variable';
import {ISetting, ISettingTabItem} from '@app/types/setting';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalCreateUpdateTabComponent} from './content-modal/modal-create-update-tab/modal-create-update-tab.component';

@Component({
  selector: 'app-tab-display',
  templateUrl: './tab-display.component.html',
  styleUrls: ['./tab-display.component.scss'],
})
export class TabDisplayComponent implements OnInit {
  private currentSetting!: ISetting;

  public tabs = [
    {name: 'Màn hình chi tiết lead'},
    {name: 'Màn hình chi tiết tác vụ'},
  ];

  public leadTabs: ISettingTabItem[] = LEAD_TABS;
  public taskTabs: ISettingTabItem[] = TASK_TABS;

  public configButtons: IFilterTopButton[] = [
    {
      name: 'add_tab',
      type: ETypeButton.PRIMARY,
      label: 'Thêm',
      icon: './assets/images/icon-plus-bold.svg',
      tooltip: 'Thêm mới tab',
    },
    {
      name: 'save',
      type: ETypeButton.PRIMARY,
      label: 'Lưu',
      iconAwesome: 'fas fa-save',
    },
  ];

  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly modalService: BsModalService,
  ) {}

  ngOnInit(): void {
    this.autoTaskService.currentSetting.subscribe({
      next: (res) => {
        if (res) {
          this.currentSetting = res;
          // this.leadTabs = res.leadTabs.map((tab) => {
          //   const tabItem = LEAD_TABS.find((t) => t.key === tab.key);
          //   return {
          //     key: tab.key,
          //     name: tabItem?.name || '',
          //     icon: tabItem?.icon || '',
          //     active: tab.active,
          //     position: tab.position,
          //   };
          // });
          // this.taskTabs = res.taskTabs.map((tab) => {
          //   const tabItem = TASK_TABS.find((t) => t.key === tab.key);
          //   return {
          //     key: tab.key,
          //     name: tabItem?.name || '',
          //     icon: tabItem?.icon || '',
          //     active: tab.active,
          //     position: tab.position,
          //   };
          // });
        }
      },
    });
  }

  handleAction(name: string) {
    if (name === 'save') {
      this.configButtons.find((btn) => btn.name === name)!.disabled = true;
      this.autoTaskService.setting.update({
        ...this.currentSetting,
        leadTabs: this.leadTabs,
        taskTabs: this.taskTabs,
      });
    } else if (name === 'add_tab') {
      const modalRef = this.modalService.show(ModalCreateUpdateTabComponent, {
        class: 'modal-dialog-centered modal-md',
      });

      modalRef.content?.saveEvent?.subscribe((data: any) => {
        const newTab: ISettingTabItem = {
          key: `iframe_${Date.now()}`,
          name: data.name,
          icon: 'iframe',
          active: data.isActive,
          position: 'center',
          url: data.url,
          parameters: data.parameters,
        } as any;

        this.leadTabs.push(newTab);
      });
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
}
