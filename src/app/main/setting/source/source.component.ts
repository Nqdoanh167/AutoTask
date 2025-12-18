import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  ESocialPlatform,
  ICommonDataLazy,
  IQueryBase,
} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {UpdateSourceComponent} from '@main/setting/source/content-modal/update-source/update-source.component';
import {
  EDataSourceType,
  EPerActSetting,
  EPerActType,
  ISource,
} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {socialPlatforms} from '@app/variable';
import {uniqBy} from 'lodash';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
})
export class SourceComponent
  extends StandardTableComponent<ISource, IQueryBase>
  implements OnInit
{
  protected readonly EDataSourceType = EDataSourceType;

  public socialPlatforms = socialPlatforms;
  public loading = {
    data: false,
  };
  public dataSources: Record<ESocialPlatform, ISource[]> = {
    [ESocialPlatform.FACEBOOK]: [],
    [ESocialPlatform.SHOPEE]: [],
    [ESocialPlatform.TIKTOK]: [],
    [ESocialPlatform.LAZADA]: [],
    [ESocialPlatform.LADIPAGE]: [],
    [ESocialPlatform.TIKI]: [],
    [ESocialPlatform.ZALO]: [],
    [ESocialPlatform.OTHER]: [],
  };
  public override configFilters: IFilterTopTable[] = [
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
  public override configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm nguồn dữ liệu',
      icon: './assets/icons/add.svg',
    },
  ];

  public permission = {
    add: false,
    edit: false,
    delete: false,
  };
  protected modalUpdateSource?: BsModalRef;

  public sources: ICommonDataLazy<ISource, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 1000,
      isActive: true,
    },
    isAllowLoadMore: false,
  };

  constructor(
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly autoTaskService: AutoTaskService,
  ) {
    super();
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    if (
      permissions?.some((per) => per === EPerActSetting.UPDATE_SOURCE_SETTING)
    ) {
      this.permission = {
        ...this.permission,
        add: true,
        edit: true,
        delete: true,
      };
    }
    if (!this.permission.add) {
      this.configButtons = this.configButtons.filter(
        (button) => button.name !== 'add_new',
      );
    }
  }

  override getDataSource() {
    let params = {...this.item.paramsQuery};
    this.loading.data = true;
    this.autoTaskService.source
      .getOrderBySource(params)
      .pipe(
        finalize(() => {
          this.loading.data = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.dataSources = {
              [ESocialPlatform.FACEBOOK]:
                res.data[ESocialPlatform.FACEBOOK] ?? [],
              [ESocialPlatform.ZALO]: res.data[ESocialPlatform.ZALO] ?? [],
              [ESocialPlatform.LADIPAGE]:
                res.data[ESocialPlatform.LADIPAGE] ?? [],
              [ESocialPlatform.OTHER]: res.data[ESocialPlatform.OTHER] ?? [],
              [ESocialPlatform.SHOPEE]: res.data[ESocialPlatform.SHOPEE] ?? [],
              [ESocialPlatform.TIKTOK]: res.data[ESocialPlatform.TIKTOK] ?? [],
              [ESocialPlatform.LAZADA]: res.data[ESocialPlatform.LAZADA] ?? [],
              [ESocialPlatform.TIKI]: res.data[ESocialPlatform.TIKI] ?? [],
            };
          }
        },
      });
  }

  getSource() {
    this.autoTaskService.source
      .get(this.sources.paramsQuery)
      .pipe(
        finalize(() => (this.sources.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sources.rows = uniqBy(
              this.sources.rows.concat(res.data),
              'id',
            );
            this.autoTaskService.setListSource(this.sources.rows);
            this.sources.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.sources.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.sources.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdate(data?: ISource) {
    if (data && !this.permission.edit) return;
    try {
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
          this.getSource();
        });
      this.modalUpdateSource.content?.deleteEvent
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: ISource) => {
          this.handleDelete(data);
          this.getSource();
        });
    } catch (e) {
      console.log(e);
    }
  }

  override handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource();
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
      errorState:
        'Cẩn trọng với thao tác xoá bản ghi. Các module khác đang sử dụng dữ liệu\n' +
        '        của bản ghi cũng sẽ bị ảnh hưởng.',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDelete(value);
    });
  }
}
