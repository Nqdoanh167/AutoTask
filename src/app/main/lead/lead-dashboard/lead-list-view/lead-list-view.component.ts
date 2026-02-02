import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {LeadDashboardData} from '../lead-dashboard.definition';
import {finalize, shareReplay, takeUntil} from 'rxjs';
import {ELeadBulkAction, IFunnel, ILead} from '@app/types/lead';
import {IColumns, ICommonDataSource, IQueryBase} from '@app/types/viewmodels';
import {LEAD_MULTIPLE_ACTIONS} from '../../lead.variable';
import {NgSelectComponent} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {listColumnsLeadDefault} from '@app/variable';
import {BsModalService} from 'ngx-bootstrap/modal';
import {OrderableTableComponent} from '@app/share/orderable-table/orderable-table.component';

@Component({
  selector: 'app-lead-list-view',
  templateUrl: './lead-list-view.component.html',
  styleUrl: './lead-list-view.component.scss',
})
export class LeadListViewComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;
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
  public multipleAction = LEAD_MULTIPLE_ACTIONS;
  public dataColumnsShow!: IColumns[];

  constructor(
    private readonly toastrService: ToastrService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
  ) {
    super();

    //set column show
    const typeColumn = 'columnLeadDashboard';
    const defaultColumn = listColumnsLeadDefault;
    const dataColumns = JSON.parse(localStorage.getItem(typeColumn) as string);
    if (
      !dataColumns ||
      !dataColumns.length ||
      typeof dataColumns[0] !== 'object'
    ) {
      localStorage.setItem(typeColumn, JSON.stringify(defaultColumn));
    }
    this.dataColumnsShow = dataColumns || defaultColumn;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFunnel']) {
      this.getDataSource(true);
    }
  }

  override ngOnInit(): void {}

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
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];
    const filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);
    if (this.currentFunnel?.id) {
      filterObj['funnelId_in'] = this.currentFunnel?.id;
    } else {
      delete filterObj['funnelId_in'];
    }
    params.filter = JSON.stringify(filterObj);

    this.leadService.lead
      .get(params)
      .pipe(
        finalize(() => {
          this.item = {...this.item, loading: false};
        }),
        shareReplay(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.meta?.total || 0;
            if (res.meta?.after) this.item.after = res.meta.after;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          console.error('Error fetching leads:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  override pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
        limit: Number(limit),
      };
    }
    delete this.item.paramsQuery.after;
    this.getDataSource();
  }

  showModalMultipleAction(action: any) {
    const selectedLeads = this.getCheckRows();
    if (!selectedLeads.length) {
      // this.toastrService.warning('Vui lòng chọn ít nhất 1 lead');
      this.selectBatchActions?.handleClearClick();
      return;
    }

    switch (action.value) {
      case ELeadBulkAction.DELETE_MULTI:
        this.handleDeleteMultiple(selectedLeads);
        break;
      default:
        this.selectBatchActions?.handleClearClick();
        break;
    }
  }

  handleDeleteMultiple(leads: ILead[]) {
    const title = 'Xóa hàng loạt Lead';
    const description = `Bạn có chắc chắn muốn xóa ${leads.length} lead đã chọn? Hành động này không thể hoàn tác.`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteMultiple(leads);
    });

    this.selectBatchActions?.handleClearClick();
  }

  onDeleteMultiple(leads: ILead[]) {
    const ids = leads.map((l) => l.id);
    this.leadService.lead
      .bulkDelete(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.toastrService.success('Xóa lead thành công');
            this.getDataSource(true);
            this.handleRefreshRow();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          this.toastrService.error('Xóa lead thất bại');
        },
      });
  }

  showModalOrderableTable() {
    const modalRef = this.modalService.show(OrderableTableComponent, {
      initialState: {
        typeColumn: 'columnLeadDashboard',
      },
      class: 'modal-opacity-4 modal-lg modal-dialog-centered modal-default',
    });

    modalRef.content?.triggerColumnChange
      .pipe()
      .subscribe((sequenceColumns: IColumns[]) => {
        this.dataColumnsShow = [...sequenceColumns];
      });
  }
}
