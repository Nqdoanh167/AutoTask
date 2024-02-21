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
import {EDataSourceType, ISourceDto} from '@app/types/setting';
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
import {SettingService} from '@app/services/api/setting.service';
import {CommonService} from '@app/services/common/common.service';
import {pick, uniqBy} from 'lodash';
import {ProductService} from '@app/services/api/product.service';

@Component({
  selector: 'app-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss'],
})
export class UpdateSourceComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
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
    parameters: this.fb.array([]),
    counselor: null,
    products: null,
    token: null,
    apiPath: null,
    apiHeaders: null,
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
  protected readonly EDataSourceType = EDataSourceType;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
    private readonly settingService: SettingService,
    private readonly commonService: CommonService,
    private readonly productService: ProductService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers = biz.users;
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formParameters() {
    return (<FormArray>this.updateForm.get('parameters')) as FormArray;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue(this.sourceData);
      if (this.sourceData.parameters) {
        this.sourceData?.parameters?.forEach((param: any) => {
          this.formParameters().push(
            this.fb.group({
              key: param.key,
              value: param.value,
            }),
          );
        });
      }
    }
    if (!this.sourceData?.id && this.formParameters().length === 0) {
      this.handleAddParameter();
    }
    this.getListProduct(true);
    this.textSearchProduct
      .pipe(takeUntil(this.destroy$), debounceTime(600), distinctUntilChanged())
      .subscribe((data) => {
        this.products.paramsQuery.q = data || '';
        this.products.paramsQuery.page = 1;
        this.getListProduct(undefined, true);
      });
  }

  handleChangeType() {
    this.updateForm.patchValue({
      token: null,
      apiPath: null,
      apiHeaders: null,
      apiBody: null,
      parameters: [],
      counselor: null,
      products: null,
    });
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
    let oldData: any = [];
    const ids: string[] = [];
    const query = {
      ...this.products.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      oldData = [...this.products.rows];
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
    } as unknown as ISourceDto;
    if (this.sourceData?.id) {
      this.settingService.source
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
      this.settingService.source
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

  handleAddParameter() {
    this.formParameters().push(this.fb.group({key: null, value: null}));
  }

  handleRemoveParameter(index: number) {
    this.formParameters().removeAt(index);
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  compareFunction(item: Product, selected: any) {
    return item.id === selected.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
