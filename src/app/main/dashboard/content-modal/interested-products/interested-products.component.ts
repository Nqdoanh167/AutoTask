import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  skip,
  Subject,
  takeUntil,
} from 'rxjs';
import {
  ControlContainer,
  FormArray,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';
import {ETypeProduct} from '@app/types/flow';
import {
  BeautyService,
  Combo,
  CourseEvent,
  ICommonDataLazy,
  IQueryBase,
  PrepaidCard,
  Product,
} from '@app/types/viewmodels';
import {ProductService} from '@app/services/api/product.service';
import {CourseEventService} from '@app/services/api/courseEvent.service';
import {ComboService} from '@app/services/api/combo.service';
import {BeautyServiceService} from '@app/services/api/beautyService.service';
import {PrepaidCardService} from '@app/services/api/prepaidCard.service';
import {pick, uniq, uniqBy} from 'lodash';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-interested-products',
  templateUrl: './interested-products.component.html',
  styleUrls: ['./interested-products.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
})
export class InterestedProductsComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup | any;
  private destroy$ = new Subject();

  public form!: FormArray;
  public formParent!: FormGroup;
  protected readonly ETypeProduct = ETypeProduct;
  public activeProductTypes: ETypeProduct[] = [];

  public products: ICommonDataLazy<Product, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      isProduct: true,
    },
    isAllowLoadMore: false,
  };

  public combos: ICommonDataLazy<Combo, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public courseEvents: ICommonDataLazy<CourseEvent, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public beautyServices: ICommonDataLazy<BeautyService, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public prepaidCards: ICommonDataLazy<PrepaidCard, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public permitModules: string[] = [];
  private textSearchProduct = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private textSearchCourseEvent = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private textSearchCombo = new BehaviorSubject<string | undefined>(undefined);
  private textSearchBeautyService = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private textSearchPrepaidCard = new BehaviorSubject<string | undefined>(
    undefined,
  );

  public firstCallRemaining = {
    product: true,
    combo: true,
    courseEvent: true,
    beautyService: true,
    prepaidCard: true,
  };

  constructor(
    private rootFormGroup: FormGroupDirective,
    private readonly commonService: CommonService,
    private readonly productService: ProductService,
    private readonly courseEventService: CourseEventService,
    private readonly comboService: ComboService,
    private readonly beautyServiceService: BeautyServiceService,
    private readonly prepaidCardService: PrepaidCardService,
    private readonly authService: AuthService,
  ) {
    this.authService.currentBiz.subscribe((biz) => {
      this.permitModules = biz?.modules?.map((el) => el.alias) || [];
    });
  }

  formCard() {
    return this.formGroup.get('cart');
  }

  patchForm(data: any) {
    try {
      const {products, combos, courseEvents, beautyServices, prepaidCards} =
        data;
      if (products?.length) {
        this.activeProductTypes = uniq([
          ...this.activeProductTypes,
          ETypeProduct.PRODUCT,
        ]);
      }
      if (combos?.length) {
        this.activeProductTypes = uniq([
          ...this.activeProductTypes,
          ETypeProduct.COMBO,
        ]);
      }
      if (courseEvents?.length) {
        this.activeProductTypes = uniq([
          ...this.activeProductTypes,
          ETypeProduct.COURSE,
        ]);
      }
      if (beautyServices?.length) {
        this.activeProductTypes = uniq([
          ...this.activeProductTypes,
          ETypeProduct.SERVICE,
        ]);
      }
      if (prepaidCards?.length) {
        this.activeProductTypes = uniq([
          ...this.activeProductTypes,
          ETypeProduct.SIM_CARD,
        ]);
      }
    } catch (e) {
      console.log(e);
    }
  }

  ngOnInit(): void {
    this.formParent = this.rootFormGroup.control as FormGroup;
    if (this.formGroup.get('cart').value) {
      this.patchForm(this.formGroup.get('cart').value);
    }
    this.formGroup.get('cart').valueChanges.subscribe((value: any) => {
      this.patchForm(value);
    });
    this.textSearchProduct
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(600),
        distinctUntilChanged(),
        skip(1),
      )
      .subscribe((data) => {
        this.products.paramsQuery.q = data || '';
        this.products.paramsQuery.page = 1;
        this.getListProduct(undefined, true);
      });
    this.textSearchCourseEvent
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(600),
        distinctUntilChanged(),
        skip(1),
      )
      .subscribe((data) => {
        this.courseEvents.paramsQuery.q = data || '';
        this.courseEvents.paramsQuery.page = 1;
        this.getListCourseEvent(undefined, true);
      });
    this.textSearchCombo
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(600),
        distinctUntilChanged(),
        skip(1),
      )
      .subscribe((data) => {
        this.combos.paramsQuery.q = data || '';
        this.combos.paramsQuery.page = 1;
        this.getListCombo(undefined, true);
      });
    this.textSearchBeautyService
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(600),
        distinctUntilChanged(),
        skip(1),
      )
      .subscribe((data) => {
        this.beautyServices.paramsQuery.q = data || '';
        this.beautyServices.paramsQuery.page = 1;
        this.getListBeautyService(undefined, true);
      });
    this.textSearchPrepaidCard
      .pipe(takeUntil(this.destroy$), debounceTime(600), distinctUntilChanged())
      .subscribe((data) => {
        this.prepaidCards.paramsQuery.q = data || '';
        this.prepaidCards.paramsQuery.page = 1;
        this.getListPrepaidCard(undefined, true);
      });
  }

  handleChangeTypeProduct($event: any, productType: ETypeProduct) {
    const isCheck = !this.activeProductTypes.includes(productType);
    if (isCheck) {
      this.activeProductTypes.push(productType);
    } else {
      this.activeProductTypes = this.activeProductTypes?.filter(
        (el) => el !== productType,
      );
      switch (productType) {
        case ETypeProduct.PRODUCT:
          this.formCard().get('products').setValue([]);
          break;
        case ETypeProduct.COMBO:
          this.formCard().get('combos').setValue([]);
          break;
        case ETypeProduct.COURSE:
          this.formCard().get('courseEvents').setValue([]);
          break;
        case ETypeProduct.SERVICE:
          this.formCard().get('beautyServices').setValue([]);
          break;
        case ETypeProduct.SIM_CARD:
          this.formCard().get('prepaidCards').setValue([]);
          break;
        default:
          break;
      }
    }
  }

  getListProduct(isInit: boolean = false, isSearching: boolean = false) {
    if (isInit) this.firstCallRemaining.product = false;
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
  getListCombo(isInit: boolean = false, isSearching: boolean = false) {
    if (isInit) this.firstCallRemaining.combo = false;
    this.combos.loading = true;
    let oldData: any = [];
    const ids: string[] = [];
    const query = {
      ...this.combos.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      oldData = [...this.combos.rows];
      this.combos.rows = [];
    }

    this.comboService.combo
      .get(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.combos.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            let newData: Combo[] = [];
            if (isSearching) {
              newData = [...res.data, ...oldData];
            } else {
              newData = [...this.combos.rows, ...res.data];
            }
            this.combos.rows = uniqBy(newData, 'id');
            this.combos.isAllowLoadMore = true;
          } else {
            this.combos.isAllowLoadMore = false;
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.combos.isAllowLoadMore = false;
          this.commonService.handleResErr(err);
        },
      });
  }
  getListBeautyService(isInit: boolean = false, isSearching: boolean = false) {
    if (isInit) this.firstCallRemaining.beautyService = false;
    this.beautyServices.loading = true;
    let oldData: any = [];
    const ids: string[] = [];
    const query = {
      ...this.beautyServices.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      oldData = [...this.beautyServices.rows];
      this.beautyServices.rows = [];
    }

    this.beautyServiceService.service
      .get(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.beautyServices.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            let newData: BeautyService[] = [];
            if (isSearching) {
              newData = [...res.data, ...oldData];
            } else {
              newData = [...this.beautyServices.rows, ...res.data];
            }
            this.beautyServices.rows = uniqBy(newData, 'id');
            this.beautyServices.isAllowLoadMore = true;
          } else {
            this.beautyServices.isAllowLoadMore = false;
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.combos.isAllowLoadMore = false;
          this.commonService.handleResErr(err);
        },
      });
  }

  getListPrepaidCard(isInit: boolean = false, isSearching: boolean = false) {
    if (isInit) this.firstCallRemaining.prepaidCard = false;
    this.prepaidCards.loading = true;
    let oldData: any = [];
    const ids: string[] = [];
    const query = {
      ...this.prepaidCards.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      oldData = [...this.prepaidCards.rows];
      this.prepaidCards.rows = [];
    }

    this.prepaidCardService.card
      .get(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.prepaidCards.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            let newData: PrepaidCard[] = [];
            if (isSearching) {
              newData = [...res.data, ...oldData];
            } else {
              newData = [...this.prepaidCards.rows, ...res.data];
            }
            this.prepaidCards.rows = uniqBy(newData, 'id');
            this.beautyServices.isAllowLoadMore = true;
          } else {
            this.prepaidCards.isAllowLoadMore = false;
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.prepaidCards.isAllowLoadMore = false;
          this.commonService.handleResErr(err);
        },
      });
  }

  getListCourseEvent(isInit: boolean = false, isSearching: boolean = false) {
    if (isInit) this.firstCallRemaining.courseEvent = false;
    this.courseEvents.loading = true;
    let oldData: any = [];
    const ids: string[] = [];
    const query = {
      ...this.courseEvents.paramsQuery,
      ...(isInit && ids.length && {ids: ids}),
    };
    if (isSearching) {
      oldData = [...this.courseEvents.rows];
      this.courseEvents.rows = [];
    }

    this.courseEventService.courseEvent
      .get(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.courseEvents.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            let newData: CourseEvent[] = [];
            if (isSearching) {
              newData = [...res.data, ...oldData];
            } else {
              newData = [...this.courseEvents.rows, ...res.data];
            }
            this.courseEvents.rows = uniqBy(newData, 'id');
            this.courseEvents.isAllowLoadMore = true;
          } else {
            this.courseEvents.isAllowLoadMore = false;
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.courseEvents.isAllowLoadMore = false;
          this.commonService.handleResErr(err);
        },
      });
  }

  handleChangeProducts(
    event: any,
    key:
      | 'products'
      | 'combos'
      | 'courseEvents'
      | 'beautyServices'
      | 'prepaidCards',
  ) {}

  compareFunction(item: Product, selected: any) {
    return item.id === selected.id;
  }

  handleSearchValue($event: {term: string; items: any[]}, type: ETypeProduct) {
    switch (type) {
      case ETypeProduct.PRODUCT:
        this.textSearchProduct.next($event.term.trim());
        break;
      case ETypeProduct.COMBO:
        this.textSearchCombo.next($event.term.trim());
        break;
      case ETypeProduct.COURSE:
        this.textSearchCourseEvent.next($event.term.trim());
        break;
      case ETypeProduct.SERVICE:
        this.textSearchBeautyService.next($event.term.trim());
        break;
      case ETypeProduct.SIM_CARD:
        this.textSearchPrepaidCard.next($event.term.trim());
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
