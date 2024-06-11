import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {
  EDataSourceType,
  ESourceArgKey,
  ISource,
  ISourceArgsDto,
  IUpdateSourceDto,
} from '@app/types/setting';
import {
  ICommonDataLazy,
  IQueryBase,
  Product,
  User,
} from '@app/types/viewmodels';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  takeUntil,
} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {ToastrService} from 'ngx-toastr';
import {CommonService} from '@app/services/common/common.service';
import {pick, uniqBy} from 'lodash';
import {ProductService} from '@app/services/api/product.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss'],
})
export class UpdateSourceComponent implements OnDestroy, OnInit {
  @Input() sourceData?: ISource;
  @Output() updateSuccess = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  private destroy$ = new Subject();
  private textSearchProduct = new BehaviorSubject<string | undefined>(
    undefined,
  );

  public submitted = false;
  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    type: EDataSourceType.MANUAL,
    isActive: true,
    arguments: this.fb.array([]),
    exeCount: null,
    counselorId: null,
    cart: this.fb.group({
      products: null,
      courseEvents: null,
      beautyServices: null,
      warehouse: null,
      prepaidCards: null,
      combos: null,
    }),
    apiEndpoint: this.fb.group({
      path: null,
      method: null,
    }),
    apiHeaders: this.fb.group({
      token: null,
    }),
    apiBody: null,
  });
  public products: ICommonDataLazy<Product, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      isParent: false,
    },
    isAllowLoadMore: false,
  };
  public listType = [
    {
      label: 'Thủ công',
      value: EDataSourceType.MANUAL,
    },
    {
      label: 'API',
      value: EDataSourceType.API,
    },
  ];
  public listBizUsers: User[] = [];
  public loading = {
    submit: false,
    data: false,
  };
  public listSourceArgKey = [
    {
      label: 'Họ tên khách hàng',
      value: ESourceArgKey.NAME,
    },
    {
      label: 'Hình ảnh',
      value: ESourceArgKey.PICTURE,
    },
    {
      label: 'Số điện thoại',
      value: ESourceArgKey.PHONE,
    },
    {
      label: 'Email',
      value: ESourceArgKey.EMAIL,
    },
    {
      label: 'Địa chỉ (Số nhà/Đường/Phố)',
      value: ESourceArgKey.ADDRESS,
    },
    {
      label: 'Đường',
      value: ESourceArgKey.STREET,
    },
    {
      label: 'Tỉnh/Thành phố',
      value: ESourceArgKey.PROVINCE_CODE,
    },
    {
      label: 'Quận/Huyện',
      value: ESourceArgKey.DISTRICT_CODE,
    },
    {
      label: 'Phường/Xã',
      value: ESourceArgKey.WARD_CODE,
    },
    {
      label: 'Sản phẩm quan tâm',
      value: ESourceArgKey.PRODUCT_NAME,
    },
    {
      label: 'Nhân viên phụ trách',
      value: ESourceArgKey.COUNSELOR_ID,
    },
    {
      label: 'Chuỗi hành động',
      value: ESourceArgKey.ADD_CHAIN_ACT_IDS,
    },
  ];
  protected readonly EDataSourceType = EDataSourceType;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly productService: ProductService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers =
          biz.users?.map((user) => {
            return {
              ...user,
              disabled: !user.isActive,
            };
          }) || [];
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formArguments() {
    return (<FormArray>this.updateForm.get('arguments')) as FormArray;
  }

  checkExistArgKey(argKey: string) {
    return this.formArguments().controls.some(
      (control) => control?.get('argKey')?.value === argKey,
    );
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
        counselorId: this.sourceData?.counselor?.id,
      } as ISource as any);
      if (this.sourceData.arguments) {
        this.sourceData?.arguments?.forEach((argument: ISourceArgsDto) => {
          this.formArguments().push(
            this.fb.group({
              argKey: [argument.argKey, Validators.required],
              argRef: [argument.argRef, Validators.required],
            }),
          );
        });
      }
    }
    this.textSearchProduct
      .pipe(takeUntil(this.destroy$), debounceTime(600), distinctUntilChanged())
      .subscribe((data) => {
        this.products.paramsQuery.q = data || '';
        this.products.paramsQuery.page = 1;
        this.getListProduct(undefined, true);
      });
  }

  handleChangeType() {
    this.submitted = false;
    this.formArguments().clear();
    this.updateForm.patchValue({
      arguments: [],
      counselorId: null,
      cart: {
        products: null,
        courseEvents: null,
        beautyServices: null,
        warehouse: null,
        prepaidCards: null,
        combos: null,
      },
    });
    if (
      this.f['type'].value === EDataSourceType.API &&
      !this.sourceData?.id &&
      this.formArguments().length === 0
    ) {
      this.handleAddArgument();
    }
  }

  handleSearchValue($event: {term: string; items: any[]}, key: string) {
    switch (key) {
      case 'products':
        this.textSearchProduct.next($event.term.trim());
        break;
      default:
        break;
    }
  }

  onDelete() {
    this.deleteEvent.emit(this.sourceData);
  }

  getListProduct(isInit: boolean = false, isSearching: boolean = false) {
    this.products.loading = true;
    const ids: string[] = [];
    const query = {
      ...this.products.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      this.products.rows = [];
    }

    this.productService.product
      .get(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.products.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            let newData: any[] = [];
            newData = [
              ...this.products.rows,
              ...res.data?.map((product) =>
                pick(product, ['id', 'name', 'picture']),
              ),
            ];
            this.products.rows = uniqBy(newData, 'id');
            this.products.isAllowLoadMore = true;
          } else {
            this.products.isAllowLoadMore = false;
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.products.isAllowLoadMore = false;
          this.commonService.handleResErr(err);
        },
      });
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {
    this.loading.submit = true;
    const body = {
      ...this.updateForm.value,
    } as any as IUpdateSourceDto;
    if (this.sourceData?.id) {
      this.autoTaskService.source
        .update(this.sourceData.id, body)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading.submit = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.commonService.handleResSuccess('update');
              this.updateSuccess.emit();
              this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    } else {
      this.autoTaskService.source
        .create(body)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.loading.submit = false)),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.commonService.handleResSuccess('create');
              this.updateSuccess.emit();
              this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  handleAddArgument() {
    this.formArguments().push(
      this.fb.group({
        argKey: [null, Validators.required],
        argRef: [null, Validators.required],
      }),
    );
  }

  handleRemoveArgument(index: number) {
    this.formArguments().removeAt(index);
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  copyApiHeaders() {
    const token = this.updateForm.get('apiHeaders')?.value?.token;
    this.copyText(`{"authorization": "Bear ${token}"}`);
  }

  copyApiBody() {
    const apiBody = this.updateForm.get('apiBody')?.value;
    this.copyText(JSON.stringify(apiBody));
  }

  compareFunction(item: Product, selected: Product) {
    return item.id === selected.id;
  }

  handleLoadMore(key: 'products') {
    if (key === 'products' && this.products.isAllowLoadMore) {
      this.products!.paramsQuery!.page! += 1;
      this.getListProduct();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
