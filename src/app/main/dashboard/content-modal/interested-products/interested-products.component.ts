import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
  Combo,
  ICommonDataLazy,
  IQueryBase,
  Product,
  ProductWarehouse,
  Warehouse,
} from '@app/types/viewmodels';
import {ProductService} from '@app/services/api/product.service';
import {pick, uniq, uniqBy} from 'lodash';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';
import {ToastrService} from 'ngx-toastr';
import {WarehouseService} from '@app/services/api/warehouse.service';
import {ComboService} from '@app/services/api/combo.service';
import {NgSelectComponent} from '@ng-select/ng-select';
import {SalecenterService} from '@app/services/api/sale.service';
import {v4 as uuidv4} from 'uuid';

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
  @ViewChild('selectProduct') selectProduct!: NgSelectComponent;
  @ViewChild('selectCombo') selectCombo!: NgSelectComponent;
  @Input() formGroup!: FormGroup | any;
  private destroy$ = new Subject();

  public form!: FormArray;
  protected readonly ETypeProduct = ETypeProduct;

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
  public inventories: {rows: ProductWarehouse; loading: boolean} = {
    rows: {},
    loading: false,
  };
  public combos: ICommonDataLazy<Combo, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      status: 'PROGRESS',
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public sameProducts: ICommonDataLazy<Product, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
    },
    isAllowLoadMore: false,
  };
  public warehouses: ICommonDataLazy<Warehouse, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public isCombo = false;
  public warehouseData!: string;

  public permitModules: string[] = [];
  private textSearchProduct = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private textSearchCombo = new BehaviorSubject<string | undefined>(undefined);
  public firstCallRemaining = {
    product: true,
  };

  constructor(
    private readonly commonService: CommonService,
    private readonly productService: ProductService,
    private readonly comboService: ComboService,
    private readonly warehouseService: WarehouseService,
    private readonly salecenterService: SalecenterService,
    private readonly authService: AuthService,
    private readonly toarst: ToastrService,
  ) {
    this.authService.currentBiz.subscribe((biz) => {
      this.permitModules = biz?.modules?.map((el) => el.alias) || [];
      if (
        !this.permitModules.includes('warehouses') ||
        !this.permitModules.includes('products')
      ) {
        this.toarst.warning(
          'Bạn không có quyền truy cập vào mục này vì chưa kích hoạt module kho hoặc sản phẩm',
        );
      }
    });
  }

  formCard() {
    return this.formGroup.get('cart');
  }
  get formProducts() {
    return this.formGroup.get('cart').value?.products;
  }
  ngOnInit(): void {
    this.getListWarehouse();
    // if (this.formGroup.get('cart').value) {
    //   this.patchForm(this.formGroup.get('cart').value);
    // }
    // this.formGroup.get('cart').valueChanges.subscribe((value: any) => {
    //   this.patchForm(value);
    // });
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
        this.getListCombo();
      });
  }
  searchByCombo() {
    this.isCombo = !this.isCombo;
    if (this.isCombo && !this.combos.rows?.length) {
      this.getListCombo();
    }
  }
  getListWarehouse() {
    this.warehouses.loading = true;
    this.warehouseService.warehouse
      .get(this.warehouses.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.warehouses.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.warehouses.rows = res.data;
            this.warehouseData =
              this.warehouses.rows.find((el) => el.isDefault)?.id ||
              res.data[0].id ||
              '';
          } else {
            this.commonService.handleResErr(res);
          }
          this.getInventoryByWarehouse();
        },
        error: (err) => {
          this.commonService.handleResErr(err);
        },
      });
  }
  getListCombo() {
    this.combos.loading = true;
    this.comboService.combo
      .get(this.combos.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.combos.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.combos.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleResErr(err);
        },
      });
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
              ...res.data?.map((product) => ({
                ...pick(product, ['id', 'code', 'name', 'picture', 'price']),
                quantity: 1,
              })),
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
  handleChangeWarehouse(event: any) {
    this.warehouseData = event?.id;
    this.getInventoryByWarehouse();
  }
  handleChangeProducts(event: any) {
    if (!event) return;
    const valueProducts = this.formGroup.get('cart').value?.products || [];
    const fProduct = valueProducts.find((el: any) => el.id === event.id && !el.combo);
    if (fProduct) {
      fProduct.quantity += 1;
    } else {
      valueProducts.push(event);
    }
    this.formGroup.get('cart').patchValue({
      products: valueProducts,
    });
    this.getInventoryByWarehouse();
    this.selectProduct?.handleClearClick();
  }
  handleChangeCombo(event: any) {
    if (!event) return;
    const ids = event?.followProducts?.reduce((acc: string[], el: any) => {
      if(el.products?.length) {
        acc.push(el.products[0]);
      }
      return acc;
    }, []);
    if(ids.length) {
      
      this.getAllProductByCombo(ids, {...event, version: uuidv4()});
    }
    this.selectCombo.handleClearClick();
  }
  matchingInventoryWithProduct(productId: string) {
    return this.inventories.rows?.[productId];
  }
  editVirtualProduct(index: number, event: any, property: string) {
    const valueProducts = this.formGroup.get('cart').value?.products || [];
    let value = null;
    if (property === 'name') {
      value = event.target.value || 'Sản phẩm ảo';
    } else if (property === 'price') {
      value = event || 0;
    }
    valueProducts[index][property] = value;
    this.formGroup.get('cart').patchValue({
      products: valueProducts,
    });
  }
  addVirtualProduct() {
    const valueProducts = this.formGroup.get('cart').value?.products || [];
    valueProducts.push({
      id: uuidv4(),
      code: 'SP-' + Math.random().toString(36).substr(2, 9),
      name: 'Sản phẩm ảo',
      picture: '',
      price: 0,
      quantity: 1,
      isVirtual: true,
    });
    this.formGroup.get('cart').patchValue({
      products: valueProducts,
    });
  }
  getSameParentProduct(id: string) {
    this.sameProducts.loading = true;
    this.productService.product
      .sameParent(id)
      .subscribe({
        next: (res) => {
          if(res && res.status === 200) {
            this.sameProducts.rows = res.data || [];
          } else {
            this.sameProducts.rows = [];

          }
          this.sameProducts.loading = false;
        },
        error: (err) => {
          this.sameProducts.loading = false;
        },
      });
  }
  getInventoryByWarehouse() {
    const query = {
      warehouse: this.warehouseData,
      product: this.formProducts?.map((el: any) => el.id).join(','),
    };
    if(!query.product) return;
    this.inventories.loading = true;
    this.salecenterService.productWarehouse.inventory(query).subscribe({
      next: (res) => {
        this.inventories.loading = false;
        this.inventories.rows = res.data;
      },
      error: (err) => {
        this.inventories.loading = false;

        this.commonService.handleResErr(err);
      },
    });
  }
  changeQuantity(event: any, index: number) {
    const valueProducts = this.formGroup.get('cart').value?.products || [];
    valueProducts[index].quantity = event;
    this.formGroup.get('cart').patchValue({
      products: valueProducts,
    });
  }
  removeProduct(index: number) {
    const valueProducts = this.formGroup.get('cart').value?.products || [];
    valueProducts.splice(index, 1);
    this.formGroup.get('cart').patchValue({
      products: valueProducts,
    });
  }
  totalPrice() {
    return this.formProducts.reduce(
      (acc: number, el: any) => acc + el.price * el.quantity,
      0,
    );
  }
  getAllProductByCombo(ids: string[], combo: Combo) {
    this.productService.product
      .all({isProduct: true, ids: ids.join(',')})
      .subscribe({
        next: (res) => {
          if (res && res.data.length) {
            const valueProducts =
              this.formGroup.get('cart').value?.products || [];

            res.data.forEach((product) => {
              const fProduct = valueProducts.find(
                (el: any) => el.id === product.id,
              );
              // if (fProduct) {
              //   fProduct.quantity += 1;
              // } else {
              //   valueProducts.push({
              //     ...pick(product, ['id', 'code', 'name', 'picture', 'price']),
              //     quantity: 1,
              //     combo: combo.id,
              //     comboName: combo.name,
              //   });
              // }
              valueProducts.push({
                ...pick(product, ['id', 'code', 'name', 'picture', 'price']),
                quantity: combo.followProducts.find(
                  (el) => el.products.includes(product.id),
                )?.quantity || 1,
                combo: combo.id,
                comboName: combo.name,
                comboVersion: combo.version,
              });
            });
            this.formGroup.get('cart').patchValue({
              products: [...valueProducts],
            });
            this.getInventoryByWarehouse();
          }
        },
        error: (err) => {
          this.commonService.handleResErr(err);
        },
      });
  }
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
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
