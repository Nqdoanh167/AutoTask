import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {IFunnel, ILead, ILeadStatus} from '@app/types/lead';
import {BehaviorSubject, distinctUntilChanged, finalize, takeUntil} from 'rxjs';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {LeadDashboardData} from '../lead-dashboard.definition';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';

@Component({
  selector: 'app-lead-kanban-view',
  templateUrl: './lead-kanban-view.component.html',
  styleUrl: './lead-kanban-view.component.scss',
})
export class LeadKanbanViewComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild('kanbanBoard', {read: ElementRef})
  kanbanBoard?: ElementRef<HTMLElement>;
  @Input() currentFunnel!: IFunnel | null;
  @Input() checkbox: any = {};
  @Input() override item: ICommonDataSource<ILead, IQueryBase> = {
    rows: [],
    loading: false,
    isFirstRequest: true,
    paramsQuery: {
      limit: 20,
      page: 1,
      q: '',
      sort: '-createdAt',
    },
    total: 0,
    after: '',
  };

  public loading = {
    kanban: false,
  };
  public statusesDisplay: ILeadStatus[] = [];
  public kanbanFilters: {
    statusId: string;
    after?: string;
  }[] = [];
  public kanbanDatas: {
    statusId: string;
    items: ILead[];
    total: number;
    after?: string;
    loadingMore?: boolean;
  }[] = [];
  private autoScrollInterval: any;
  private readonly SCROLL_SPEED = 15;
  private readonly EDGE_THRESHOLD = 100;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFunnel']) {
      const statusGroup = this.statusGroups.rows.find(
        (group) =>
          group.id === changes['currentFunnel'].currentValue?.statusGroupId,
      );
      if (statusGroup) {
        this.statusesDisplay = statusGroup.leadStatusIds
          .map((statusId) =>
            this.statuses.rows.find((status) => status.id === statusId),
          )
          .filter(Boolean) as ILeadStatus[];
      }

      this.kanbanFilters =
        statusGroup?.leadStatusIds.map((statusId) => ({
          statusId: statusId,
          after: '',
        })) || [];
      this.getCountData();
    }
  }

  override ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  getKanbanDataByStatusId(statusId?: string) {
    return this.kanbanDatas.find((data) => data.statusId === statusId);
  }

  /**
   * Áp dụng các filter chung cho filterObj (funnelId, accessibleIds, roleIds)
   */
  protected applyCommonFilters(filterObj: any): void {
    if (this.checkbox.accessibleIds?.length) {
      filterObj['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      delete filterObj['accessibleIds'];
    }
    delete filterObj['branchIds'];
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];
    if (validRoleIds.length > 0) {
      filterObj['teams.roleId_in'] = validRoleIds;
    } else {
      delete filterObj['teams.roleId_in'];
    }
    const validUserIds = Array.isArray(this.checkbox.userIds)
      ? this.checkbox.userIds.filter((id: any) => id != null && id !== '')
      : [];
    if (validUserIds.length > 0) {
      filterObj['teams.userId_in'] = validUserIds;
    } else {
      delete filterObj['teams.userId_in'];
    }
  }

  getCountData() {
    if (!this.kanbanFilters.length) {
      return;
    }

    this.loading.kanban = true;
    let params = {
      ...this.item.paramsQuery,
    };
    delete params.page;
    // get filter
    let filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);
    if (this.currentFunnel?.id) {
      filterObj['funnelId_in'] = this.currentFunnel?.id;
    } else {
      delete filterObj['funnelId_in'];
    }

    filterObj.items = [];
    this.kanbanFilters.forEach((filter) => {
      filterObj.items.push({
        statusId: filter.statusId,
        after: filter.after || undefined,
      });
    });
    params.filter = JSON.stringify(filterObj);

    this.leadService.lead
      .getCount(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.kanban = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.kanbanDatas = [];
            (res.data || []).forEach((item: any) => {
              this.kanbanDatas.push({
                statusId: item.statusId,
                items: [],
                total: item.count || 0,
              });
            });
            // update kanbanFilters (loại bỏ những status có count = 0)
            const filters = this.kanbanFilters.filter((filter) => {
              const count = res.data.find(
                (item: any) => item.statusId === filter.statusId,
              )?.count;
              return count > 0;
            });

            if (filters.length) {
              filterObj.items = [];
              filters.forEach((filter) => {
                filterObj.items.push({
                  statusId: filter.statusId,
                  after: filter.after || undefined,
                });
              });
              params.filter = JSON.stringify(filterObj);
              this.getKanbanData(params);
            }
          }
        },
      });
  }

  getKanbanData(params: any) {
    this.leadService.lead
      .getKanban(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.kanban = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            (res.data || []).forEach((item: any) => {
              const itemData = this.kanbanDatas.find(
                (data) => data.statusId === item.statusId,
              );

              if (itemData) {
                itemData.items = [...item.items];
                itemData.after = item.after;
              }
            });
          }
        },
      });
  }

  private stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  onLeadDragMoved(event: CdkDragMove) {
    if (!this.kanbanBoard) return;

    const container = this.kanbanBoard.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const pointerX = event.pointerPosition.x;

    // Dừng scroll trước khi kiểm tra
    this.stopAutoScroll();

    // Scroll sang trái khi kéo gần biên trái
    if (pointerX - containerRect.left < this.EDGE_THRESHOLD) {
      this.startAutoScroll('left');
    }
    // Scroll sang phải khi kéo gần biên phải
    else if (containerRect.right - pointerX < this.EDGE_THRESHOLD) {
      this.startAutoScroll('right');
    }
  }

  private startAutoScroll(direction: 'left' | 'right') {
    if (!this.kanbanBoard || this.autoScrollInterval) return;

    this.autoScrollInterval = setInterval(() => {
      const container = this.kanbanBoard!.nativeElement;
      const scrollAmount =
        direction === 'left' ? -this.SCROLL_SPEED : this.SCROLL_SPEED;
      container.scrollLeft += scrollAmount;

      // Dừng khi đã đến cuối
      if (
        (direction === 'left' && container.scrollLeft <= 0) ||
        (direction === 'right' &&
          container.scrollLeft >= container.scrollWidth - container.clientWidth)
      ) {
        this.stopAutoScroll();
      }
    }, 16); // ~60fps
  }

  onLeadDrop(event: CdkDragDrop<ILead[]>) {
    this.stopAutoScroll();

    const previousStatusId = event.previousContainer.id;
    const currentStatusId = event.container.id;
    const lead = event.item.data;
    const previousData = this.kanbanDatas.find(
      (data) => data.statusId === previousStatusId,
    );
    const currentData = this.kanbanDatas.find(
      (data) => data.statusId === currentStatusId,
    );

    if (event.previousContainer === event.container) {
      const leads = currentData?.items || [];
      moveItemInArray(leads, event.previousIndex, event.currentIndex);
      return;
    }

    const previousLeads = previousData?.items || [];
    const currentLeads = currentData?.items || [];

    transferArrayItem(
      previousLeads,
      currentLeads,
      event.previousIndex,
      event.currentIndex,
    );

    const newStatusId = currentStatusId;
    this.leadService.lead
      .update(lead.id, {id: lead.id, statusId: newStatusId})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            lead.statusId = newStatusId;
          } else {
            transferArrayItem(
              currentLeads,
              previousLeads,
              event.currentIndex,
              event.previousIndex,
            );
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          transferArrayItem(
            currentLeads,
            previousLeads,
            event.currentIndex,
            event.previousIndex,
          );
          console.error('Update lead status error:', err);
        },
      });
  }

  onKanbanColumnScroll(event: Event, statusId: string) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const kanbanData = this.getKanbanDataByStatusId(statusId);
    if (!kanbanData) return;
    if (
      scrollHeight - scrollTop - clientHeight < 100 &&
      !kanbanData?.loadingMore
    ) {
      if (kanbanData?.after && kanbanData.items.length < kanbanData.total) {
        this.loadMoreKanbanData(statusId);
      } else {
        kanbanData.loadingMore = false;
      }
    }
  }

  loadMoreKanbanData(statusId: string) {
    const kanbanData = this.getKanbanDataByStatusId(statusId);
    if (!kanbanData?.after || kanbanData?.loadingMore) {
      return;
    }

    kanbanData.loadingMore = true;

    let params = {
      ...this.item.paramsQuery,
    };
    delete params.page;
    const filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);

    filterObj.items = [
      {
        statusId: statusId,
        after: kanbanData.after,
      },
    ];
    params.filter = JSON.stringify(filterObj);

    this.leadService.lead
      .getKanban(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          kanbanData.loadingMore = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            const responseData = (res.data || []).find(
              (item: any) => item.statusId === statusId,
            );
            if (responseData && kanbanData) {
              kanbanData.items = [...kanbanData.items, ...responseData.items];
              kanbanData.after = responseData.after;

              const filters = this.kanbanFilters.map((filter) =>
                filter.statusId === statusId
                  ? {...filter, after: responseData.after}
                  : filter,
              );
              this.kanbanFilters = [...filters];
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          console.error('Error loading more leads:', err);
          this.commonService.handleResErr(err);
        },
      });
  }
}
