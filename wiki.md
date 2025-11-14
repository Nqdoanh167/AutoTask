# SMAX Auto-Task Frontend - Technical Wiki

> **Tối ưu cho AI Context** | Angular 17 | Loại trừ module lead (code mới)

---

## 1. CODE CONVENTIONS

### 1.1 Naming
- **Components**: kebab-case (modal-update-task.component.ts)
- **Classes**: PascalCase (DashboardComponent, BaseApiService)
- **Interfaces**: PascalCase với prefix `I` (ITask, IColumns, IFilterTopTable)
- **Enums**: PascalCase với prefix `E` (ERole, ETypeFilter, EActionStates)
- **Variables/Functions**: camelCase (currentBiz, fetchData)
- **Constants**: UPPER_SNAKE_CASE (TASK_MULTIPLE_ACTIONS, listColumnsDashboardDefault)
- **Files**: kebab-case.extension (dashboard.component.ts, auth.service.ts)

### 1.2 Code Style (Prettier + ESLint)
```javascript
// .prettierrc.js
{
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 80,
  bracketSpacing: false
}

// ESLint: component selector kebab-case, directive camelCase
```

### 1.3 TypeScript Config
- **Path aliases**: `@app/*`, `@main/*`, `@share/*`
- **Strict mode**: enabled
- **Target**: ES2017, Module: ES2020

---

## 2. ARCHITECTURE PATTERNS

### 2.1 Component Structure
```
feature-module/
├── feature.component.ts       # Main component
├── feature.component.html
├── feature.component.scss
├── feature.module.ts          # Feature module
├── feature-routing.module.ts  # Routing
├── feature-variables.ts       # Constants/configs
├── feature-data.ts           # Static data
├── feature-check-permission.ts # Permission logic
└── content-modal/            # Sub-components
    ├── modal-xxx/
    └── components/
```

### 2.2 Base Component Pattern
```typescript
// Extend base component cho lifecycle management
export class DashboardComponent extends DashboardCheckPermission implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Base component có sẵn: BaseComponentsComponent
// - Tự động inject AuthService
// - Subscribe currentBiz, currentUser
// - Auto cleanup với destroy$
```

### 2.3 Service Patterns
```typescript
// Base service cho API calls
export class FeatureService extends BaseApiService {
  constructor(protected httpClient: HttpClient) {
    super(httpClient);
  }
  
  // Methods: get, create, update, delete, query
  // Return: Observable<EntityResult<T>>
}

// Modal service pattern
export class ModalConfirmService {
  public toggleModal = new BehaviorSubject<{isOpen: boolean; key?: string}>({isOpen: false});
  
  openModal(content, key?, okFunc?, declineFunc?) {}
  closeModal() {}
}
```

### 2.4 State Management
- **BehaviorSubject** cho shared state
- **ReplaySubject** cho events
- **Subject** cho destroy signals
- **takeUntil(destroy$)** để cleanup subscriptions

---

## 3. COMMON COMPONENTS

### 3.1 Shared Components (@share/common)
```typescript
// Base components
- base-components/BaseComponentsComponent   // Base class với auth context
- standard-table/StandardTableComponent     // Table với sort, filter
- checkbox-table/CheckboxSortTableComponent // Table với checkbox selection

// Input components
- input-select-customer/InputSuggestCustomerComponent
- dropdown-search/DropdownSearchComponent
- select-location/SelectLocationComponent

// Modal components
- modal-call-in/ModalCallInComponent
- modal-call-out/ModalCallOutComponent
- modal-export-excel/ModalExportExcelComponent
- modal-import-excel/ModalImportExcelComponent

// Filter components
- filter-top-table/FilterTopTableComponent  // Main filter toolbar
- filter-advance/FilterAdvanceComponent
- filter-checkbox/FilterCheckboxComponent

// Layout components
- custom-tab-set/CustomTabSetComponent
- view-mode-tab/ViewModeTabComponent
```

### 3.2 Custom Components (@share/custom)
```typescript
// UI components
- custom-modal/CustomModalComponent         // Base modal wrapper
- custom-modal-confirm/CustomModalConfirmComponent
- custom-button-loading/CustomButtonLoadingComponent
- custom-loading/CustomLoadingComponent
- custom-pagination/CustomPaginationComponent

// Input components
- custom-input-search/CustomInputSearchComponent
- custom-select-search/CustomSelectSearchComponent
- custom-date-picker/CustomDatePickerComponent
- custom-input-range-number/CustomInputRangeNumberComponent
- custom-input-range-time/CustomInputRangeTimeComponent

// Table components
- custom-standard-table/CustomStandardTableComponent
- custom-change-page/CustomChangePageComponent

// Select components
- input-select-checkbox/InputSelectCheckboxComponent
- multi-lazy-select/MultiLazySelectComponent
```

### 3.3 Input Components (@share/input)
```typescript
- input-checkbox/InputCheckboxComponent
- input-datetime/InputDatetimeComponent
- input-editor/InputEditorComponent         // CKEditor
- input-mask/InputMaskComponent             // Masked input
- input-select/InputSelectComponent         // ng-select wrapper
- input-upload/InputUploadComponent
- input-upload-preview/InputUploadPreviewComponent
- textarea/TextareaComponent
```

---

## 4. DIRECTIVES & PIPES

### 4.1 Directives (@share/directive)
```typescript
// Utility directives
- ng-let.directive                          // *ngLet="value as variable"
- fallback-image/FallbackImageDirective     // [appFallbackImage]
- resizeable-columns/                       // Resizable table columns
- resizeable-height-element/
- scroll-to-bottom/ScrollToBottomDirective
- sticky-table/StickyTableDirective
- tooltip/TooltipDirective

// Decorators (@share/decorator)
- throttle-event.decorator                  // @ThrottleEvent({durationMs: 1000})
```

### 4.2 Pipes (@share/pipe)
```typescript
// Format pipes
- mycurrency.pipe                           // {{value | mycurrency}}
- format-date-dmy/formatDateDMY.pipe
- format-seconds/format-seconds.pipe
- textTransform/textTransform.pipe

// Calculate pipes
- calculate-deadline/calculate-deadline.pipe
- calculate-task-deadline/calculate-task-deadline.pipe
- calculate-division/calculateDivision.pipe
- calculate-percent/calculatePercent.pipe
- diff-time/diffTime.pipe

// Filter pipes
- filter-data/filter-data.pipe
- search-filter/searchFilter.pipe
- inArrayFilter.pipe
- sort-by.pipe

// Utility pipes
- safeUrl.pipe
- timeView.pipe
- get-data-array/getDataArray.pipe
- convertType/convertType.pipe
- filterColorGlobal.pipe
```

---

## 5. TYPE SYSTEM

### 5.1 Core Types (@app/types/viewmodels.ts)
```typescript
// User & Auth
- User, Biz, BizRole, BizModule, BizGroup
- Branch, Department, Team, FlatBranch
- ERole: OWNER, DEV, MEMBER, ADMIN, MOD

// Common
- EntityResult<T>, ICommonDataSource<T,K>, ICommonDataLazy<T,K>
- Option, IColumns, ITag, IDateRange
- IQueryBase, IMetaData, IPaginationStandard
- BackendError, BaseInterface, AccountPublic

// Business entities
- Product, Category, Group, Unit, Property, Warehouse
- Order, OrderCart, OrderTeam, OrderPlatformSource
- Coupon, LoyaltyRank, Segment, Collaborator
- BeautyService, Combo, PrepaidCard, CourseEvent

// UI
- ISidebar, ITabFilter, Config
- ESocialPlatform: FACEBOOK, SHOPEE, TIKTOK, LAZADA, TIKI, ZALO
- EModule: DASHBOARD, CONFIG, SETTING, LEAD
- ETabHistoryKey: NOTE, INFORMATION, ORDER_PRODUCT
```

### 5.2 Feature Types
```typescript
// Common (@app/types/common)
- ETypeFilter: SEARCH, POPOVER, SELECT, DATE
- ETypeBulkUpdate: REMOVE_TEAM, ASSIGN_TEAM, DELETE_MULTI_TASK
- ETypeButton: PRIMARY, DEFAULT, TOGGLE, SUB_PRIMARY
- IFilterTopTable, IFilterTopButton

// Flow (@app/types/flow)
- ITask, ITaskChain, ITaskChainResult, ITeam
- ETaskChainType, EActionStates, EEditedDateState

// Setting (@app/types/setting)
- ISetting, UserAcl, EPerActTask, EPerActType, EScreens

// Task (@app/types/task)
- ETabTaskDetail
```

---

## 6. SERVICES

### 6.1 Core Services (@app/services)
```typescript
// API Services (@app/services/api)
- base.service              // BaseApiService - base cho mọi API service
- auth.service              // Login, logout, currentBiz$, currentUser$
- autoTask.service          // Task CRUD operations
- admin.service
- user.service
- customer.service
- product.service
- location.service
- storage.service           // Upload files
- socket.service            // WebSocket

// Common Services (@app/services/common)
- common.service
- local-storage.service
- breadcrumb.service
- phone-call.service        // Omicall integration
- omicall.service
- stringee.service

// Guards (@app/services/guard)
- auth.guard
- hasPermissionAccess.guard
- hasPermissionAccessSubModule.guard

// Interceptors
- token.interceptor         // Add JWT to requests
```

### 6.2 Service Patterns
```typescript
// API service methods follow REST pattern
class FeatureService extends BaseApiService {
  // GET /api/resource
  query(params: IQueryBase): Observable<EntityResult<T[]>>
  
  // GET /api/resource/:id
  get(id: string): Observable<EntityResult<T>>
  
  // POST /api/resource
  create(data: T): Observable<EntityResult<T>>
  
  // PUT /api/resource/:id
  update(id: string, data: Partial<T>): Observable<EntityResult<T>>
  
  // DELETE /api/resource/:id
  delete(id: string): Observable<EntityResult<any>>
  
  // Helper methods
  protected createParams(params: {[key: string]: any}): HttpParams
  protected createUrl(paths: string[]): string
}
```

---

## 7. UTILITIES (@app/utils)

### 7.1 Common Utils (common.ts)
```typescript
// Time calculation
- diffMinutes(minuend, subtrahend): number
- calculateTime(subtrahend, minuend, typeReturn): string | metrics

// Sorting
- sortBy(sortOrder, sortProperty, property)
- sortIcon(property, sortProperty, sortOrder): string
- sortByClient(data, staticData, sortOrder, sortProperty, property, isNumber?)

// Data manipulation
- getObjectKeys(obj): string[]
- getObjectValues(obj): string[]
- getLastValueObject(obj): {key, value}
- filterItems<T>(items, fields, value): T[]
- normalizeToNumberArray(value): number[]
- flattenData(data, prefix?): Record<string, any>

// Phone validation
- getPhoneVNFromText(text): string[]
- checkPhoneVN(num): string | false

// String utils
- trimValue(value, type): string | undefined
- removeCharacter(str): string  // Remove Vietnamese accents
- compareObjects(obj1, obj2): boolean

// Async
- snooze(ms): Promise<void>

// Upload helper
- UploadFile class (injectable service)
```

### 7.2 Other Utils
```typescript
// checkBoxTable.ts
- Checkbox table helpers

// converter.ts
- Data conversion utilities

// formatDate.ts
- Date formatting functions

// search-helper.ts
- Search optimization helpers

// variables.ts
- Global variables/constants

// xlsx.ts
- Excel export/import utilities
```

---

## 8. STYLES (@app/styles)

### 8.1 Variables (_variable.scss)
```scss
// Colors
$primary-500: #fa6e5b;
$secondary-500: #4277ff;
$neutral-500: #0f1835;
$green-500: #53b27f;
$red-500: #ef6a6a;
$yellow-500: #ffb800;

// Spacing
$space-xs: 2px; $space-s: 4px; $space-m: 8px;
$space-l: 16px; $space-xl: 24px; $space-xxl: 32px;

// Radius
$radius-xs: 2px; $radius-s: 6px; $radius-m: 12px;
$radius-l: 16px; $radius-xl: 24px;

// Button sizes
$button-small: 24px; $button-medium: 36px; $button-large: 48px;

// Input sizes
$input-medium: 36px; $input-large: 48px;

// Layout
$header-height: 50; $padding-content-site: 40;
$filter-top-height: 36; $pagination-height: 56;
```

### 8.2 Typography Classes
```scss
// Titles
.title-1 to .title-5        // 42px to 20px
.headline                    // 16px, 600
.subhead                     // 14px, 600

// Body
.paragraph-1, .paragraph-2   // 16px/14px, 400
.body-1, .body-2            // 16px/14px, 400

// Small
.callout-regular/semibold/uppercase  // 12px
.footnote-regular/semibold/uppercase // 10px

// Colors
.normal-text, .primary-text, .secondary-text
.success-text, .sub-text, .disabled-text
```

### 8.3 Component Classes
```scss
// Buttons
.button-fill              // Primary solid button
.button-sub-primary       // Secondary colored button
.button-outline           // Border button
.button-gap               // Dashed border
.button-iconic-*          // Icon-only buttons (tiny/small/medium)

// Inputs
.basic-input              // Standard input
.basic-input-title        // Title input
.basic-checkbox           // Checkbox with custom style
.basic-radio              // Radio with animation
ng-select.basic-select    // Select with custom style

// Modal
.modal-default            // Standard modal
.modal-confirm-default    // Confirm modal

// Shadows
.shadow-xs/s/m/l          // 4 levels of elevation
```

---

## 9. MODULE STRUCTURE

### 9.1 App Structure
```
app/
├── admin/                # Admin module
├── main/                 # Main features
│   ├── dashboard/       # Task management (legacy)
│   ├── flow/            # Flow configuration (legacy)
│   ├── setting/         # Settings (legacy)
│   └── lead/            # NEW - không tham khảo
├── share/               # Shared components
│   ├── common/         # Business common components
│   ├── custom/         # UI components
│   ├── input/          # Form inputs
│   ├── directive/      # Directives
│   ├── pipe/           # Pipes
│   ├── layout/         # Layout components
│   ├── modal/          # Modal components
│   └── orderable-table/
├── services/            # Services & API
├── types/               # TypeScript types
├── utils/               # Utility functions
├── variable/            # Constants
└── styles/              # SCSS variables & mixins
```

### 9.2 Module Import Pattern
```typescript
@NgModule({
  declarations: [components],
  imports: [
    CommonModule,
    FeatureRoutingModule,
    
    // Forms
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    
    // UI Libraries
    TabsModule,
    ModalModule,
    TooltipModule,
    BsDropdownModule,
    PopoverModule,
    AccordionModule,
    
    // Custom components
    CustomModalComponent,
    CustomButtonLoadingComponent,
    FilterTopTableComponent,
    
    // Pipes & Directives
    LetDirective,
    MycurrencyPipe,
    TimeViewPipe,
  ]
})
```

---

## 10. BEST PRACTICES

### 10.1 Component Patterns
```typescript
// 1. Extend base component cho auth context
export class MyComponent extends BaseComponentsComponent {}

// 2. Sử dụng destroy$ cho cleanup
protected destroy$ = new Subject<void>();
ngOnInit() {
  this.service.data$.pipe(takeUntil(this.destroy$)).subscribe();
}
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// 3. Standalone components cho reusable UI
@Component({
  standalone: true,
  imports: [CommonModule, ...],
})

// 4. Inject services qua constructor hoặc inject()
protected readonly authService = inject(AuthService);
```

### 10.2 Data Flow Patterns
```typescript
// 1. Query params structure
interface IQueryBase {
  limit?: number;
  page?: number;
  q?: string;           // Search query
  filter?: any;         // Filter object
  sort?: string;        // '-fieldName' descending, 'fieldName' ascending
  'searchFields[]'?: string[];
}

// 2. Response structure
interface EntityResult<T> {
  status: number;
  message: string;
  data: T;
  total: number;
  meta?: IMetaData;
}

// 3. Pagination structure
interface IMetaData {
  total: number;
  totalPage: number;
  countRows: number;
  currentPage: number;
  limit: number;
  after?: string;
}
```

### 10.3 Modal Patterns
```typescript
// 1. Modal with CustomModalComponent wrapper
@Component({
  template: `
    <app-custom-modal
      [isLoading]="isLoading"
      [isSubmitting]="isSubmitting"
      [textOk]="'Lưu'"
      (submitModal)="onSubmit()"
      (hideModal)="onCancel()">
      <!-- Content here -->
    </app-custom-modal>
  `
})

// 2. Modal with ModalConfirmService
constructor(private modalConfirmService: ModalConfirmService) {}

showConfirm() {
  const content: IModalConfirmContent = {
    title: 'Xác nhận',
    description: 'Bạn có chắc chắn?',
    okText: 'Đồng ý',
    type: 'warning',
    modalType: 'advance'
  };
  
  this.modalConfirmService.openModal(
    content,
    'uniqueKey',
    () => this.onOk(),
    () => this.onCancel()
  );
}

// 3. Open modal with BsModalService
constructor(private modalService: BsModalService) {}

openModal() {
  const initialState = {data: this.data};
  this.modalRef = this.modalService.show(
    ModalComponent,
    {initialState, class: 'modal-lg'}
  );
}
```

### 10.4 Permission Handling
```typescript
// 1. Extend permission check class
export class DashboardComponent extends DashboardCheckPermission {
  // Auto có permission checking logic
}

// 2. Check permission trong template
<div *ngIf="hasPermission(EPerActTask.CREATE_TASK)">
  <button>Tạo tác vụ</button>
</div>

// 3. Route guard
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [HasPermissionAccessGuard],
    data: {permissions: [EPerActTask.VIEW_TASK]}
  }
];
```

### 10.5 Error Handling
```typescript
// 1. Service level
getData() {
  return this.http.get<EntityResult<Data>>(url).pipe(
    catchError(error => {
      this.toastr.error(error.message);
      return throwError(() => error);
    })
  );
}

// 2. Component level
loadData() {
  this.isLoading = true;
  this.service.getData().subscribe({
    next: (res) => {
      this.data = res.data;
      this.isLoading = false;
    },
    error: (err) => {
      this.toastr.error('Có lỗi xảy ra');
      this.isLoading = false;
    }
  });
}

// 3. Global error handler (app.module.ts)
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error(error);
    // Handle chunk loading errors
    if (/Loading chunk [\d]+ failed/.test(error.message)) {
      window.location.reload();
    }
  }
}
```

### 10.6 Performance Patterns
```typescript
// 1. TrackBy functions cho *ngFor
trackById(index: number, item: any): string {
  return item.id;
}

// 2. OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// 3. Throttle/Debounce với decorator
@ThrottleEvent({durationMs: 1000})
handleEvent(data: any) {
  // This will be throttled
}

// 4. Virtual scrolling cho large lists
<cdk-virtual-scroll-viewport itemSize="50">
  <div *cdkVirtualFor="let item of items">
    {{item.name}}
  </div>
</cdk-virtual-scroll-viewport>
```

---

## 11. CONFIGURATION FILES

### 11.1 Environment
```typescript
// environment.ts / environment.prod.ts
export const environment = {
  production: false,
  apiAddress: 'http://localhost:3000/api'
};
```

### 11.2 Angular Config (angular.json)
- Build output: dist/fontend/
- Assets: assets/, favicon.ico
- Styles: src/styles.scss, bootstrap
- Scripts: ckeditor, omicall, stringee

### 11.3 Package Management
```json
// Main dependencies
"@angular/*": "17.3.x"
"@ng-select/ng-select": "12.0.7"
"ngx-bootstrap": "12.0.0"
"rxjs": "7.8.0"
"lodash": "4.17.21"
"moment": "2.29.4"
"socket.io-client": "4.8.1"
```

---

## 12. CONSTANTS & VARIABLES

### 12.1 Global Variables (@app/variable/index.ts)
```typescript
// Column definitions
- listColumns: IDataColumns
- listColumnsDashboardDefault: IColumns[]
- listColumnsLeadDefault: IColumns[]

// Navigation items
- listSettingNavItems: ISidebar[]
- listDashboardNavItems: ISidebar[]
- listConfigNavItems: ISidebar[]
- listLeadNavItems: ISidebar[]
- listLeadSettingNavItems: ISidebar[]

// Options
- optionToCloneTask
- socialPlatforms
- mappingStringeeCallStatus
```

### 12.2 Feature Variables
```typescript
// dashboard-variables.ts
- TASK_MULTIPLE_ACTIONS
- TASK_CONFIG_FILTERS: IFilterTopTable[]
- ranges (date ranges for filters)
- FORM_EXPORT_EXCEL
- TASK_FIELD_GROUP_EXPORT_EXCEL

// Các module khác có pattern tương tự
- feature-variables.ts chứa config cho từng feature
```

---

## 13. TESTING

### 13.1 Commands
```bash
npm run test           # Run tests
npm run lint           # ESLint
npm run lint:fix       # Fix lint errors
npm run prettier       # Check format
npm run prettier:fix   # Fix format
npm run check-types    # TypeScript check
npm run test-all       # Full check
```

### 13.2 Pre-commit Hooks (Husky)
```json
"lint-staged": {
  "src/**/*.{ts,html,css,scss}": [
    "prettier --write",
    "eslint --max-warnings=0"
  ]
}
```

---

## 14. IMPORTANT NOTES

### 14.1 Code Organization
- **Không tham khảo module lead** - đây là code mới chưa hoàn thiện
- **Tham khảo dashboard, flow, setting** - legacy code có patterns tốt
- **Ưu tiên reuse shared components** thay vì tạo mới
- **Extend base classes** khi cần auth context hoặc permission

### 14.2 Common Gotchas
- Always use `takeUntil(destroy$)` với subscriptions
- Use path aliases (`@app/`, `@share/`, `@main/`)
- Check permissions trước khi hiển thị/thực hiện action
- Handle loading/error states trong mọi API call
- Use `EntityResult<T>` wrapper cho API responses

### 14.3 Development Workflow
1. Check existing shared components trước khi tạo mới
2. Follow naming conventions nghiêm ngặt
3. Add types cho tất cả data structures
4. Test với linter/prettier trước commit
5. Document complex logic với comments
6. Use constants file cho config/options
7. Keep components focused - split nếu quá lớn

---

**Last Updated**: 2025-11-21
**Angular Version**: 17.3.10
**Target Modules**: dashboard, flow, setting (legacy code)
**Excluded**: lead module (new code)
