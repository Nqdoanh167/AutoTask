import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from './dashboard.component';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalUpdateTaskComponent} from './content-modal/modal-update-task/modal-update-task.component';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';
import {ModalModule} from 'ngx-bootstrap/modal';
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {NgxMaskDirective} from 'ngx-mask';
import {TextAreaComponent} from '@share/input/textarea/textarea.component';
import {TaskChainItemComponent} from './content-modal/task-chain-item/task-chain-item.component';
import {FilterDataModule} from '@share/pipe/filter-data/filter-data.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {InterestedProductsComponent} from './content-modal/interested-products/interested-products.component';
import {CustomerInfoComponent} from './content-modal/customer-info/customer-info.component';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {ModalCallComponent} from './content-modal/modal-call/modal-call.component';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {ViewModeTabComponent} from '@share/common/view-mode-tab/view-mode-tab.component';
import {ModalAssignTeamComponent} from './content-modal/multiple-action/modal-assign-team/modal-assign-team.component';
import {OrderableTableModule} from '@app/share/orderable-table/orderable-table.module';
import {CustomDatePickerComponent} from '@app/share/custom/custom-date-picker/custom-date-picker.component';
import {OrdersComponent} from './content-modal/orders/orders.component';
import {HistoryComponent} from './content-modal/history/history.component';
import {ModalCloneComponent} from './content-modal/multiple-action/modal-clone/modal-clone.component';
import {InputMaskModule} from '@app/share/input/input-mask/input-mask.module';
import {TreeSelectModule} from 'primeng/treeselect';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';
import {CustomTabSetComponent} from '@share/common/custom-tab-set/custom-tab-set.component';
import {CalculateTaskDeadlinePipe} from '@share/pipe/calculate-task-deadline/calculate-task-deadline.pipe';
import {MycurrencyPipe} from '@share/pipe/mycurrency.pipe';
import {TimeViewPipe} from '@share/pipe/timeView.pipe';
import {GetDataArrayPipe} from '@share/pipe/get-data-array/getDataArray.pipe';
import {CalculateDeadlinePipe} from '@share/pipe/calculate-deadline/calculate-deadline.pipe';
import {LetDirective} from '@share/directive/ng-let.directive';
import {ModalAssignTeamV2Component} from './content-modal/multiple-action/modal-assign-team-v2/modal-assign-team-v2.component';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {ModalFeedbackComponent} from './content-modal/modal-feedback/modal-feedback.component';
import {NgxStarsModule} from 'ngx-stars';
import {InputUploadPreviewComponent} from '../../share/input/input-upload-preview/input-upload-preview.component';
import {TaskCreateSourceComponent} from './content-modal/task-create-source/task-create-source.component';
import {SafePipe} from '@app/share/pipe/safeUrl.pipe';
import {ModalCreateOrderComponent} from './content-modal/modal-create-order/modal-create-order.component';
import {FilterAdvanceComponent} from '../../share/common/filter-advance/filter-advance.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {HeaderModule} from '../../share/layout/header/header.module';
import {InputCheckboxModule} from '@app/share/input/input-checkbox/input-checkbox.module';
import {InputSelectCheckboxModule} from '../../share/common/filter-checkbox/filter-checkbox.component.module';
import {ModalCreateBookingComponent} from './content-modal/modal-create-booking/modal-create-booking.component';
import {BookingsComponent} from './content-modal/bookings/bookings.component';
import {ModalDrawTaskComponent} from './content-modal/modal-draw-task/modal-draw-task.component';
import {InArrayFilterPipe} from '@app/share/pipe/inArrayFilter.pipe';
import {CdkDragPlaceholder} from '@angular/cdk/drag-drop';
import {ModalCloseTaskComponent} from './content-modal/modal-close-task/modal-close-task.component';
import {ModalCloseMultiTasksComponent} from './content-modal/modal-close-multi-tasks/modal-close-multi-tasks.component';
import {ModalCheckDuplicatedPhoneComponent} from './content-modal/modal-check-duplicated-phone/modal-check-duplicated-phone.component';
import {ActivityLogComponent} from './content-modal/activity-log/activity-log.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ModalCloneComponent,
    ModalUpdateTaskComponent,
    UpdateActionInTaskChainComponent,
    TaskChainItemComponent,
    InterestedProductsComponent,
    CustomerInfoComponent,
    ModalAssignTeamComponent,
    ModalCallComponent,
    OrdersComponent,
    HistoryComponent,
    ActivityLogComponent,
    ModalAssignTeamV2Component,
    ModalFeedbackComponent,
    ModalCreateOrderComponent,
    ModalCreateBookingComponent,
    BookingsComponent,
    ModalDrawTaskComponent,
    ModalCloseTaskComponent,
    ModalCloseMultiTasksComponent,
    ModalCheckDuplicatedPhoneComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    OrderableTableModule,
    CustomPaginationComponent,
    FilterTopTableComponent,
    ModalConfirmComponent,
    CustomModalComponent,
    InputMaskModule,
    FormsModule,
    TextAreaComponent,
    NgSelectModule,
    ReactiveFormsModule,
    TabsModule,
    FallbackImageModule,
    AccordionModule,
    CustomButtonLoadingComponent,
    ModalModule,
    BsDropdownModule,
    PopoverModule,
    NgxMaskDirective,
    TextAreaComponent,
    FilterDataModule,
    TooltipModule,
    InputSuggestCustomerComponent,
    CustomInputSearchComponent,
    ViewModeTabComponent,
    CustomDatePickerComponent,
    TreeSelectModule,
    CustomSelectSearchComponent,
    CustomTabSetComponent,
    CalculateTaskDeadlinePipe,
    MycurrencyPipe,
    TimeViewPipe,
    GetDataArrayPipe,
    CalculateDeadlinePipe,
    LetDirective,
    ProgressbarModule.forRoot(),
    NgxStarsModule,
    InputUploadPreviewComponent,
    SafePipe,
    FilterAdvanceComponent,
    ScrollingModule,
    HeaderModule,
    InputSelectCheckboxModule,
    InputCheckboxModule,
    InArrayFilterPipe,
    CdkDragPlaceholder,
    TaskCreateSourceComponent
],
})
export class DashboardModule {}
