import {Component, OnDestroy, OnInit} from '@angular/core';
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
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {IActResult} from '@app/types/flow';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss'],
})
export class ResultComponent implements OnInit, OnDestroy {
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
      icon: './assets/images/icon/plus.svg',
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
  constructor(
    private readonly modalService: BsModalService,
    private readonly configurationService: ConfigurationService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  ngOnInit() {
    this.getDataSource();
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

  handleDeleteAction(value: any) {
    const title = 'Xóa kết quả';
    const description = `Bạn sắp xóa kết quả ${
      value.name || ''
    }, hành động này không thể hoàn tác.`;
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
