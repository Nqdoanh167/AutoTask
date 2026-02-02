import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil, finalize} from 'rxjs';
import {
  IHistory,
  Biz,
  ETabHistoryKey,
  EInformationContentHistoryTask,
  EOrderProductContentHistoryTask,
  ENoteContentHistoryTask,
  ESubInformationContentHistoryTask,
  ESubOrderProductHistoryTask,
  EInformationContentHistoryLead,
} from '@app/types/viewmodels';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {AuthService} from '@app/services/api/auth.service';
import moment from 'moment';
import {CommonModule} from '@angular/common';
import {LeadService} from '@app/services/api/lead.service';

interface IActivityGroup {
  title: string;
  icon: string;
  activities: IHistory[];
}

@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ActivityLogComponent implements OnInit, OnDestroy {
  @Input() taskId!: string;
  @Input() leadId!: string;

  public loading = false;
  public groupedActivities: IActivityGroup[] = [];
  public currentBiz!: Biz;
  private destroy$ = new Subject();
  public ETabHistoryKey = ETabHistoryKey;
  public CALL_PHONE_ACTION = EInformationContentHistoryTask.CALL_PHONE;

  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly authService: AuthService,
    private readonly leadService: LeadService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz || '';
      });
  }

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities() {
    const params = {
      page: 1,
      limit: 100,
      filter: JSON.stringify({taskId: this.taskId}),
      sort: '-createdAt',
    };

    if (this.taskId) {
      this.loading = true;
      this.autoTaskService.history
        .get(params)
        .pipe(
          finalize(() => (this.loading = false)),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            const activities = res.data?.map((item) => ({
              ...item,
              actionBy:
                this.currentBiz.users?.find(
                  (user) => user.id === item.actionBy.id,
                ) ||
                item.actionBy ||
                {},
            }));
            this.groupActivitiesByDate(activities);
          },
        });
      return;
    }

    if (this.leadId) {
      params.filter = JSON.stringify({leadId: this.leadId});
      this.loading = true;
      this.leadService.history
        .get(params)
        .pipe(
          finalize(() => (this.loading = false)),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            const activities = res.data?.map((item) => ({
              ...item,
              actionBy:
                this.currentBiz.users?.find(
                  (user) => user.id === item.actionBy.id,
                ) ||
                item.actionBy ||
                {},
            }));
            this.groupActivitiesByDate(activities);
          },
        });

      return;
    }
  }

  groupActivitiesByDate(activities: IHistory[]) {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const weekStart = moment().startOf('week');

    const todayActivities: IHistory[] = [];
    const yesterdayActivities: IHistory[] = [];
    const thisWeekActivities: IHistory[] = [];

    activities.forEach((activity) => {
      const activityDate = moment(activity.createdAt).startOf('day');

      if (activityDate.isSame(today, 'day')) {
        todayActivities.push(activity);
      } else if (activityDate.isSame(yesterday, 'day')) {
        yesterdayActivities.push(activity);
      } else if (activityDate.isSameOrAfter(weekStart)) {
        thisWeekActivities.push(activity);
      }
    });

    this.groupedActivities = [];

    if (todayActivities.length > 0) {
      this.groupedActivities.push({
        title: 'Hôm Nay',
        icon: 'calendar-check',
        activities: todayActivities,
      });
    }

    if (yesterdayActivities.length > 0) {
      this.groupedActivities.push({
        title: 'Hôm Qua',
        icon: 'calendar-check',
        activities: yesterdayActivities,
      });
    }

    if (thisWeekActivities.length > 0) {
      this.groupedActivities.push({
        title: 'Tuần Này',
        icon: 'calendar-check',
        activities: thisWeekActivities,
      });
    }
  }

  getActionContent(action?: string) {
    switch (action) {
      case EOrderProductContentHistoryTask.CREATE_ORDER:
        return `Tạo đơn hàng`;
      case EOrderProductContentHistoryTask.ADD_PRODUCTS:
        return `Thêm sản phẩm`;
      case EOrderProductContentHistoryTask.CHANGE_WAREHOUSES:
        return `Thay đổi kho`;
      case EOrderProductContentHistoryTask.REMOVE_PRODUCTS:
        return `Xóa sản phẩm`;
      case EOrderProductContentHistoryTask.CHANGE_PRODUCTS:
        return `Thay đổi sản phẩm`;
      case EOrderProductContentHistoryTask.ADD_COMBOS:
        return `Thêm combo`;
      case EOrderProductContentHistoryTask.REMOVE_COMBOS:
        return `Xóa combo`;
      case EOrderProductContentHistoryTask.CHANGE_COMBOS:
        return `Thay đổi combo`;
      case EOrderProductContentHistoryTask.ADD_BEAUTISERVICES:
        return `Thêm dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.REMOVE_BEAUTISERVICES:
        return `Xóa dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.CHANGE_BEAUTISERVICES:
        return `Thay đổi dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.ADD_COURSEEVENTS:
        return `Thêm khóa học sự kiện`;
      case EOrderProductContentHistoryTask.REMOVE_COURSEEVENTS:
        return `Xóa khóa học sự kiện`;
      case EOrderProductContentHistoryTask.CHANGE_COURSEEVENTS:
        return `Thay đổi khóa học sự kiện`;
      case ENoteContentHistoryTask.ADD_NOTE:
        return `Thêm ghi chú`;
      case ENoteContentHistoryTask.CHANGE_NOTE:
        return `Sửa ghi chú`;
      case ENoteContentHistoryTask.UPLOAD_FILE:
        return `Tải file lên`;
      case ENoteContentHistoryTask.REMOVE_FILE:
        return `Xóa file`;
      case ENoteContentHistoryTask.REMOVE_NOTE:
        return `Xóa ghi chú`;
      case EInformationContentHistoryTask.ADD_TAG:
        return `Thêm tag`;
      case EInformationContentHistoryTask.CHANGE_TAG:
        return `Thay đổi tag`;
      case EInformationContentHistoryTask.REMOVE_TAG:
        return `Xóa tag`;
      case EInformationContentHistoryTask.CREATE_TASK:
        return `Tác vụ được tạo`;
      case EInformationContentHistoryTask.CHANGE_CUSTOMER:
        return `Thay đổi khách hàng`;
      case EInformationContentHistoryTask.NAME_TASK:
        return `Thay đổi tên task`;
      case EInformationContentHistoryTask.SOURCE:
        return `Nguồn dữ liệu`;
      case EInformationContentHistoryTask.CHANGE_SOURCE:
        return `Thay đổi nguồn dữ liệu`;
      case EInformationContentHistoryTask.CHANGE_NOTE_I:
        return `Thay đổi ghi chú`;
      case EInformationContentHistoryTask.COUNSELOR:
        return `Nhân sự phụ trách`;
      case EInformationContentHistoryTask.CUSTOMER:
        return `Khách hàng`;
      case EInformationContentHistoryTask.ADD_CHAIN:
        return `Thêm chuỗi hành động`;
      case EInformationContentHistoryTask.REMOVE_CHAIN:
        return `Xóa chuỗi hành động`;
      case EInformationContentHistoryTask.CHANGE_CHAIN:
        return `Thay đổi chuỗi hành động`;
      case EInformationContentHistoryTask.INIT_PRODUCT:
        return `Khởi tạo sản phẩm`;
      case EInformationContentHistoryTask.CHANGE_ACTION:
        return `Thay đổi hành động`;
      case EInformationContentHistoryTask.SEND_BLOCK_AUTOMATION:
        return `Gửi block automation`;
      case EInformationContentHistoryTask.CALL_PHONE:
        return `Gọi điện thoại`;
      case EInformationContentHistoryTask.LOCKED_CHAIN:
        return `Khóa chuỗi hành động`;
      case EInformationContentHistoryTask.ROLE:
        return `Vai trò`;
      case EInformationContentHistoryTask.BRANCH:
        return `Gán chi nhánh`;
      case EInformationContentHistoryTask.CHANGE_BRANCH:
        return `Thay đổi chi nhánh`;
      case EInformationContentHistoryTask.CHAT_LINK:
        return `Thay đổi Link Cuộc hội thoại`;
      case ESubInformationContentHistoryTask.ACTION:
        return `Hành động`;
      case ESubInformationContentHistoryTask.NONE:
        return ``;
      case ESubOrderProductHistoryTask.NONE:
        return ``;
      case EInformationContentHistoryTask.DRAW_TASK:
        return `Rút số thành công`;
      case EInformationContentHistoryTask.DROP_TASK:
        return `Thả số thành công`;
      case EInformationContentHistoryTask.CLOSE_TASK:
        return `Đóng tác vụ`;
      case EInformationContentHistoryLead.CREATE_LEAD:
        return `Tạo lead`;
      case EInformationContentHistoryLead.NAME_LEAD:
        return `Thay đổi tên lead`;
      case EInformationContentHistoryLead.STATUS:
        return `Trạng thái`;
      case EInformationContentHistoryLead.CHANGE_STATUS:
        return `Thay đổi trạng thái`;
      case EInformationContentHistoryLead.FUNNEL:
        return `Funnel`;
      case EInformationContentHistoryLead.CHANGE_FUNNEL:
        return `Thay đổi funnel`;
      default:
        return '';
    }
  }

  formatDateTime(date: Date): string {
    return moment(date).format('DD/MM/YYYY - HH:mm');
  }

  hasConnectorLine(group: IActivityGroup, index: number): boolean {
    return index < group.activities.length - 1;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
