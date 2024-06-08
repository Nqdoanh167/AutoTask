import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {ICommonDataSource} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalUpdateActionComponent} from '@main/flow/data/content-modal/modal-update-action/modal-update-action.component';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {EActionType, IAction} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {sortBy, sortIcon} from '@app/utils/common';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss'],
})
export class ActionComponent implements OnInit, OnDestroy {
  @Input() hasEditPer = false;
  private destroy$ = new Subject();

  public actionTypes: any = this.configurationService.actionTypes;
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên hành động...',
    },
    {
      type: ETypeFilter.SELECT,
      name: 'type',
      placeholder: 'Loại',
      options: this.actionTypes,
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
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
  public dataSource: ICommonDataSource<IAction, any> = {
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
    this.autoTaskService.action
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

  handleUpdate(value?: IAction) {
    const modalUpdate = this.modalService.show(ModalUpdateActionComponent, {
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

  onDelete(value: IAction) {
    this.autoTaskService.action
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

  handleDeleteAction(value: IAction) {
    const title = 'Xóa hành động';
    const description = `Bạn sắp xóa hành động <b>${
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

  renderNameType(value: EActionType) {
    return (
      this.actionTypes?.find((type: any) => type.value == value).label ?? '-'
    );
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
