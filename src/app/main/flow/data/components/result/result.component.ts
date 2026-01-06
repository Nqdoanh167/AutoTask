import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {ModalUpdateResultComponent} from '@main/flow/data/content-modal/modal-update-result/modal-update-result.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {EResultType, IActResult} from '@app/types/flow';
import {sortBy, sortIcon} from '@app/utils/common';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss'],
})
export class ResultComponent implements OnInit, OnDestroy {
  @Input() hasEditPer = false;
  private destroy$ = new Subject();

  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Kết quả...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm mới',
      icon: './assets/images/icon-plus-bold.svg',
    },
  ];
  public dataSource: ICommonDataSource<IActResult, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };
  public resultTypes = this.configurationService.resultTypes;
  private sortProperty: string = 'createdAt';
  private sortOrder = 1;
  constructor(
    private readonly modalService: BsModalService,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  ngOnInit() {
    this.getDataSource();
    if (!this.hasEditPer) {
      this.configButtons = this.configButtons.filter(
        (item) => item.name !== 'add_new',
      );
    }
  }

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.dataSource.loading = true;
    this.autoTaskService.actionResult
      .get(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.dataSource.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.dataSource.rows = res.data;
            this.dataSource.total = res.total;
          }
        },
      });
  }

  handleUpdate(value?: IActResult) {
    const modalUpdate = this.modalService.show(ModalUpdateResultComponent, {
      initialState: {
        sourceData: value,
      },
    });
    modalUpdate?.content?.updateSuccess
      .pipe()
      .subscribe(() => this.getDataSource());
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        limit: Number(limit),
      };
    }
    this.getDataSource();
  }

  onDelete(value: IActResult) {
    this.autoTaskService.actionResult
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.getDataSource();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleDeleteAction(value: IActResult) {
    const title = 'Xóa kết quả';
    const description = `Bạn sắp xóa kết quả <b>${
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
      errorState:
        'Cẩn trọng với thao tác xoá bản ghi. Các module khác đang sử dụng dữ liệu\n' +
        '        của bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDelete(value);
    });
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }

  sortBy(property: string): void {
    const {sortProperty, sortOrder, sortQuery} = sortBy(
      this.sortOrder,
      this.sortProperty,
      property,
    );
    [this.sortProperty, this.sortOrder] = [sortProperty, sortOrder];
    this.dataSource.paramsQuery = {
      ...this.dataSource.paramsQuery,
      sort: sortQuery ? sortQuery : undefined,
    };
    this.getDataSource(true);
  }

  sortIcon(property: string) {
    return sortIcon(property, this.sortProperty, this.sortOrder);
  }

  renderNameType(value: EResultType) {
    return (
      this.resultTypes?.find((type: any) => type.value == value)?.label ?? '-'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
