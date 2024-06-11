import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from './dashboard.component';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {PipeTimeViewModule} from '@share/pipe/timeView.module';
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
import {MycurrencyModule} from '@app/share/pipe/mycurrency.module';
import {HistoryComponent} from './content-modal/history/history.component';
import {ModalCloneComponent} from './content-modal/multiple-action/modal-clone/modal-clone.component';
import {InputMaskModule} from '@app/share/input/input-mask/input-mask.module';
import {TreeSelectModule} from 'primeng/treeselect';

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
  ],
  imports: [
    CommonModule,
    MycurrencyModule,
    DashboardRoutingModule,
    OrderableTableModule,
    CustomPaginationComponent,
    FilterTopTableComponent,
    ModalConfirmComponent,
    PipeTimeViewModule,
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
  ],
})
export class DashboardModule {}
