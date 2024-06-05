import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {EntityPagination, ITag, User} from '@app/types/viewmodels';
import {Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {environment} from '../../../../environments/environment';
import {removeCharacter} from '@app/utils/common';
import {ModalEmployeeInfoComponent} from '@main/setting/components/modal-employee-info/modal-employee-info.component';
import {BsModalService} from 'ngx-bootstrap/modal';
import {FormBuilder} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
})
export class TagComponent implements OnDestroy, OnInit {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo tên tag...',
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
      label: 'Thêm',
      icon: './assets/images/icon/plus.svg',
    },
  ];
  isAdd = {
    tag: false as boolean,
  };
  public indexEdit = {
    tag: undefined as number | undefined,
  };
  public dataSelected = {
    tag: undefined as any,
  };
  public addEditForm = {
    tag: this.fb.group({
      name: [null],
      bgColor: ['#000000'],
    }) as ITag | any,
  };
  public tags: EntityPagination<ITag> = {
    rows: [],
    loading: false,
    limit: 20,
    query: {},
    page: 1,
    total: 0,
  };
  public loading = {
    data: false,
  };
  public submitted = false;

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private fb: FormBuilder,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz.alias || '';
      });
  }

  ngOnInit() {
    this.getListTag();
  }
  getListTag() {
    const params = {...this.tags.query};
    this.autoTaskService.tag
      .get(params)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tags.total = res.data.length || 0;
            this.tags.rows = res.data;
          }
        },
      });
  }
  onDelete(value: any) {
    this.autoTaskService.tag
      .delete(value.id as string)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.getListTag();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  onDeleteItem(value: any) {
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
    };

    this.modalConfirmService.openModal(modalContent, 'delete');
  }
  handleAction(name: string) {
    if (name === 'reload') {
      this.getListTag();
    }
    if (name === 'add_new') {
      this.addEdit();
    }
  }

  onSubmit() {
    this.submitted = true;
    if (!this.addEditForm.tag.valid) {
      return;
    }
    this.handleAddEditTag();
  }
  handleAddEditTag(): void {
    const {name, bgColor} = this.addEditForm.tag.value;
    const body: ITag = {
      name: name!,
      bgColor: bgColor || '#000000',
    };
    const serviceRef = this.isAdd.tag
      ? this.autoTaskService.tag.create(body)
      : this.autoTaskService.tag.update(this.dataSelected.tag.id, body);
    serviceRef.pipe(take(1)).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess();
          this.getListTag();
        } else {
          this.commonService.handleResErr(res);
        }
        this.cancelAddEdit();
      },
    });
  }
  addEdit(item?: ITag, index?: number): void {
    this.cancelAddEdit();
    if (typeof item === 'undefined') {
      this.isAdd.tag = true;
    } else {
      this.indexEdit.tag = index;
      this.dataSelected.tag = item;
      this.addEditForm.tag.patchValue(item);
    }
  }
  cancelAddEdit() {
    this.isAdd.tag = false;
    this.indexEdit.tag = undefined;
    this.dataSelected.tag = undefined;
    this.addEditForm.tag.reset();
  }

  onSearch(value: {term: string; name: string}) {
    const {term, name} = value;
    const keyword = removeCharacter(term)
      .toLocaleLowerCase()
      .replace(/[ ]+/, ' ');
    if (name === ETypeFilter.SEARCH) {
      this.tags.query.q = keyword;
      this.getListTag();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
