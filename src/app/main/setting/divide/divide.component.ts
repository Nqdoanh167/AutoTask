import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {AutoTaskService} from '@app/services/api/autoTask.service';

import {sortIcon} from 'src/app/utils/common';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {
  ICommonDataSource,
  IQueryBase,
  TaskDistributionConfig,
} from '@app/types/viewmodels';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {CommonService} from '@app/services/common/common.service';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalUpdateDivideComponent} from './modal-update-divide/modal-update-divide.component';

@Component({
  selector: 'app-divide',
  templateUrl: './divide.component.html',
  styleUrls: ['./divide.component.scss'],
})
export class DivideComponent implements OnInit, OnDestroy {
  @Input() hasEditPer = true;
  private destroy$ = new Subject();

  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo tên cấu hình...',
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
      icon: './assets/images/icon/plus.svg',
    },
  ];
  public dataSource: ICommonDataSource<TaskDistributionConfig, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };

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
    this.autoTaskService.taskDistributionConfig
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

  handleUpdate(value?: TaskDistributionConfig) {
    const modalUpdate = this.modalService.show(ModalUpdateDivideComponent, {
      initialState: {
        sourceData: value,
      },
      class: 'modal-lg',
      backdrop: 'static',
    });
    modalUpdate.content?.updateItem.pipe(takeUntil(this.destroy$)).subscribe({
      next: (item) => {
        const has = this.dataSource.rows.find((r) => r.id === item.id);
        if (has) Object.assign(has, item);
      },
    });

    modalUpdate.content?.addItem.pipe(take(1)).subscribe({
      next: (item) => {
        if (item) {
          this.dataSource.rows.unshift(item);
          this.dataSource.total! += 1;
          if (this.dataSource.rows.length > this.dataSource.paramsQuery.limit!)
            this.dataSource.rows.pop();
        }
      },
    });
  }

  onDelete(value: TaskDistributionConfig) {
    this.autoTaskService.taskDistributionConfig
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.dataSource.rows = this.dataSource.rows.filter(
              (item) => item.id !== value.id,
            );
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleDeleteAction(value: TaskDistributionConfig) {
    const title = 'Xóa cấu hình chia số';
    const description = `Bạn sắp cấu hình chia số <b>${
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
      this.dataSource.paramsQuery.page = page;
    }
    if (limit) {
      this.dataSource.paramsQuery.limit = limit;
    }
    this.getDataSource();
  }

  sortBy(property: string) {
    if (this.sortProperty === property) {
      this.sortOrder = this.sortOrder * -1;
    } else {
      this.sortProperty = property;
      this.sortOrder = 1;
    }
    this.dataSource.paramsQuery.sort = `${
      this.sortOrder === 1 ? '' : '-'
    }${property}`;
    this.getDataSource();
  }

  sortIcon(property: string) {
    return sortIcon(property, this.sortProperty, this.sortOrder);
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
