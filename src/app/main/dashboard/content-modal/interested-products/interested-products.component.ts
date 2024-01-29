import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
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
import {uniqBy} from 'lodash';
import {CommonService} from '@app/services/common/common.service';

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
  public activeProductTypes = [ETypeProduct.PRODUCT];

  public products: ICommonDataLazy<Product, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
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

  constructor(
    private rootFormGroup: FormGroupDirective,
    private readonly commonService: CommonService,
    private readonly productService: ProductService,
    private readonly courseEventService: CourseEventService,
    private readonly comboService: ComboService,
    private readonly beautyServiceService: BeautyServiceService,
    private readonly prepaidCardService: PrepaidCardService,
  ) {}

  get formProducts() {
    return <FormArray>this.formGroup.get('products');
  }

  ngOnInit(): void {
    this.formParent = this.rootFormGroup.control as FormGroup;
    this.getListProduct(true);
    this.getListCourseEvent(true);
    this.getListCombo(true);
    this.getListBeautyService(true);
    this.getListPrepaidCard(true);
  }

  handleChangeTypeProduct($event: any, productType: ETypeProduct) {
    const arrayTo = this.formGroup.value?.products;
    const indexFormTo = arrayTo?.findIndex(
      (el: any) => el.type === productType,
    );
    const isCheck = !this.activeProductTypes.includes(productType);
    if (isCheck) {
      this.activeProductTypes.push(productType);
    } else {
      if (this.activeProductTypes.length <= 1) {
        $event.preventDefault();
        return;
      } else {
        this.activeProductTypes = this.activeProductTypes?.filter(
          (el) => el !== productType,
        );
      }
    }
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
            let newData: Product[] = [];
            if (isSearching) {
              newData = [...res.data, ...oldData];
            } else {
              newData = [...this.products.rows, ...res.data];
            }
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

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
