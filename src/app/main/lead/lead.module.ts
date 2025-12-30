import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {LeadComponent} from './lead.component';
import {LeadRoutingModule} from './lead-routing.module';
import {LeadDashboardComponent} from './lead-dashboard/lead-dashboard.component';
import {LeadFormModalComponent} from './lead-dashboard/lead-form-modal/lead-form-modal.component';
import {LeadCreateModalComponent} from './lead-dashboard/lead-create-modal/lead-create-modal.component';
import {LeadBulkMoveModalComponent} from './lead-dashboard/lead-bulk-move-modal/lead-bulk-move-modal.component';
import {LeadConnectionsModalComponent} from './lead-dashboard/lead-connections-modal/lead-connections-modal.component';
import {LeadCommentsSidebarComponent} from './lead-dashboard/lead-comments-sidebar/lead-comments-sidebar.component';
import {SortLeadStatusModalComponent} from './lead-dashboard/sort-lead-status-modal/sort-lead-status-modal.component';
import {FolderFormModalComponent} from './lead-dashboard/folder-form-modal/folder-form-modal.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HeaderModule} from '@share/layout/header/header.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {TreeSelectModule} from 'primeng/treeselect';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';
import {CustomTabSetComponent} from '@share/common/custom-tab-set/custom-tab-set.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {FilterAdvanceComponent} from '@share/common/filter-advance/filter-advance.component';
import {RouterModule} from '@angular/router';
import {InputUploadModule} from '@app/share/input/input-upload/input-upload.module';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {InputCheckboxModule} from '@share/input/input-checkbox/input-checkbox.module';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {TimeViewPipe} from '@app/share/pipe/timeView.pipe';
import { MycurrencyPipe } from '@app/share/pipe/mycurrency.pipe';
import { Hex2RgbPipe } from '@app/share/pipe/hex2rgb.pipe';
import { ModalModule } from "ngx-bootstrap/modal";
import { CustomDatePickerComponent } from '@app/share/custom/custom-date-picker/custom-date-picker.component';

@NgModule({
  declarations: [
    LeadComponent,
    LeadDashboardComponent,
    LeadFormModalComponent,
    LeadCreateModalComponent,
    LeadBulkMoveModalComponent,
    LeadConnectionsModalComponent,
    LeadCommentsSidebarComponent,
    SortLeadStatusModalComponent,
    FolderFormModalComponent,
  ],
  imports: [
    CommonModule,
    LeadRoutingModule,
    InputUploadModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderModule,
    CustomPaginationComponent,
    FilterTopTableComponent,
    FilterAdvanceComponent,
    ModalConfirmComponent,
    CustomModalComponent,
    NgSelectModule,
    TreeSelectModule,
    TabsModule,
    TooltipModule,
    BsDropdownModule,
    StandardTableComponent,
    CustomButtonLoadingComponent,
    CustomTabSetComponent,
    ScrollingModule,
    DragDropModule,
    CustomInputSearchComponent,
    InputSuggestCustomerComponent,
    CollapseModule,
    InputCheckboxModule,
    PopoverModule,
    TimeViewPipe,
    MycurrencyPipe,
    Hex2RgbPipe,
    ModalModule,
    CustomDatePickerComponent
],
  providers: [DatePipe],
})
export class LeadModule {}
