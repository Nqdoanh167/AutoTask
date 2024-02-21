import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {finalize, Subject, takeUntil} from 'rxjs';
import {ICommonDataSource} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {UpdateSourceComponent} from '@main/setting/source/content-modal/update-source/update-source.component';
import {EDataSourceType, ISource} from '@app/types/setting';
import {sortBy, sortIcon} from '@app/utils/common';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
})
export class SourceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  protected readonly EDataSourceType = EDataSourceType;
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
    {
      type: ETypeFilter.SELECT,
      name: 'type',
      placeholder: 'Loại',
      options: [
        {
          label: 'Thủ công',
          value: EDataSourceType.MANUAL,
        },
        {
          label: 'API',
          value: EDataSourceType.API,
        },
      ],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      multiple: false,
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
      label: 'Thêm nguồn dữ liệu',
      icon: './assets/images/icon/plus.svg',
    },
  ];

  public dataSource: ICommonDataSource<ISource, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };
  protected modalUpdateSource?: BsModalRef;
  private sortProperty: string = 'createdAt';
  private sortOrder = 1;
  constructor(
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  ngOnInit() {
    this.getDataSource();
  }

  getDataSource(isReset: boolean = false) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.dataSource.loading = true;
    this.autoTaskService.source
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

  handleUpdate(data?: any) {
    this.modalUpdateSource = this.modalService.show(UpdateSourceComponent, {
      initialState: {
        sourceData: data,
      },
      class: 'modal-dialog-centered modal-custom-size-l',
    });
    this.modalUpdateSource.onHide?.pipe().subscribe(() => {});
    this.modalUpdateSource.content?.updateSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getDataSource();
      });
    this.modalUpdateSource.content?.deleteEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ISource) => {
        this.handleDelete(data);
      });
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }

  onSelectFilter(data: {value?: string; name: string}) {
    try {
      const {value, name} = data;
      const filter = this.dataSource.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      if (value || Number(value) === 0) {
        obj[name] = value;
      } else {
        delete obj[name];
      }
      this.dataSource.paramsQuery.filter = JSON.stringify(obj);
      this.getDataSource(true);
    } catch (e) {
      console.log(e);
    }
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  onDelete(value: ISource) {
    this.autoTaskService.source
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            if (this.modalUpdateSource) {
              this.modalUpdateSource.hide();
            }
            this.getDataSource();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleDelete(value: ISource) {
    const title = 'Xóa nguồn dữ liệu';
    const description = `Bạn sắp xóa nguồn dữ liệu <b>${
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
    this.modalConfirmService.openModal(modalContent, 'delete');
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
