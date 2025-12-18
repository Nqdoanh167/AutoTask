import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {EntityPagination, ITag} from '@app/types/viewmodels';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {removeCharacter} from '@app/utils/common';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {FormBuilder, Validators} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {EPerActSetting, EPerActType} from '@app/types/setting';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
})
export class TagComponent implements OnDestroy, OnInit {
  @ViewChild('templateAddEditTag') templateAddEditTag!: TemplateRef<any>;
  public addEditTagModalRef?: BsModalRef;

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
      icon: './assets/icons/add.svg',
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
      name: [null, Validators.required],
      bgColor: ['#000000'],
      applyFor: ['TASK'],
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
    addEditTag: false,
  };
  public submitted = false;
  public submittedModal = {
    addEditTag: false,
  };
  public permission = {
    add: false,
    edit: false,
    delete: false,
  };

  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private fb: FormBuilder,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly modalService: BsModalService,
  ) {
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    if (permissions?.some((per) => per === EPerActSetting.UPDATE_TAG_SETTING)) {
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

  ngOnInit() {
    this.getListTag();
  }
  getListTag() {
    this.loading.data = true;
    const params = {...this.tags.query};
    this.autoTaskService.tag
      .get(params)
      .pipe(
        take(1),
        finalize(() => (this.loading.data = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tags.total = res.data.length || 0;
            this.tags.rows = res.data;
            this.autoTaskService.setListTag(res.data);
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
      errorState: 'Bạn chắc chắn xóa tag này?',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDelete(value);
    });
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
    this.submittedModal.addEditTag = true;
    if (!this.addEditForm.tag.valid) {
      return;
    }
    this.handleAddEditTag();
  }
  handleAddEditTag(): void {
    const {name, bgColor, applyFor} = this.addEditForm.tag.value;
    const body: ITag = {
      name: name!,
      bgColor: bgColor || '#000000',
      applyFor: applyFor || 'TASK',
    };
    this.loading.addEditTag = true;
    const serviceRef = this.isAdd.tag
      ? this.autoTaskService.tag.create(body)
      : this.autoTaskService.tag.update(this.dataSelected.tag.id, body);
    serviceRef
      .pipe(
        take(1),
        finalize(() => (this.loading.addEditTag = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess();
            this.getListTag();
            this.addEditTagModalRef?.hide();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }
  handleAddEditTagModal() {
    this.addEditTagModalRef = this.modalService.show(this.templateAddEditTag, {
      class: 'modal-dialog-centered modal-add-edit-tag',
    });
    this.addEditTagModalRef?.onHide
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.submittedModal.addEditTag = false;
        this.cancelAddEdit();
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
    this.handleAddEditTagModal();
  }
  cancelAddEdit() {
    this.isAdd.tag = false;
    this.indexEdit.tag = undefined;
    this.dataSelected.tag = undefined;
    this.addEditForm.tag.reset({
      name: null,
      bgColor: '#000000',
      applyFor: 'TASK',
    });
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
