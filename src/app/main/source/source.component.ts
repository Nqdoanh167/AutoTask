import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {Subject} from 'rxjs';
import {ICommonDataSource} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
})
export class SourceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
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

  public dataSource: ICommonDataSource<any, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };
  constructor(
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
  ) {}

  ngOnInit() {}

  getDataSource(isReset: boolean = false) {}

  handleUpdate(data?: any) {}

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  onDelete(value: any) {
    // this.autoTaskService.task
    //     .delete(value.id)
    //     .pipe()
    //     .subscribe({
    //       next: (res) => {
    //         if (res.status === 200) {
    //           this.commonService.handleResSuccess('delete');
    //           this.getDataSource();
    //         } else {
    //           this.commonService.handleResErr(res);
    //         }
    //       },
    //       error: (err) => this.commonService.handleErr(err),
    //     });
  }

  handleDelete(value: any) {
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
