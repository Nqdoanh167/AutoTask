import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil, finalize} from 'rxjs';
import {IHistory, Biz} from '@app/types/viewmodels';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {AuthService} from '@app/services/api/auth.service';
import moment from 'moment';

interface IActivityGroup {
  title: string;
  icon: string;
  activities: IHistory[];
}

@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent implements OnInit, OnDestroy {
  @Input() taskId!: string;

  public loading = false;
  public groupedActivities: IActivityGroup[] = [];
  public currentBiz!: Biz;
  private destroy$ = new Subject();

  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly authService: AuthService,
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
    this.loading = true;
    const params = {
      page: 1,
      limit: 100,
      filter: JSON.stringify({taskId: this.taskId}),
      sort: '-createdAt',
    };

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

  getActivityDescription(activity: IHistory): string {
    const contents: string[] = [];

    if (activity.content.information) {
      activity.content.information.forEach((item) => {
        if (item.value) {
          contents.push(item.value);
        }
      });
    }

    if (activity.content.orderProduct) {
      activity.content.orderProduct.forEach((item) => {
        if (item.value) {
          contents.push(item.value);
        }
      });
    }

    if (activity.content.note) {
      activity.content.note.forEach((item) => {
        if (item.value) {
          contents.push(item.value);
        }
      });
    }

    return contents.join(', ') || 'Không có mô tả';
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
