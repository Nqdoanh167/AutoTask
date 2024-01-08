import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlowComponent} from './flow.component';
import {FlowRoutingModule} from './flow-routing.module';
import {RuleComponent} from './rule/rule.component';
import {DataComponent} from './data/data.component';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {ActionComponent} from './data/components/action/action.component';
import {ChainActionComponent} from './data/components/chain-action/chain-action.component';
import {ReasonComponent} from './data/components/reason/reason.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {ConvertTypeModule} from '@share/pipe/convertType/convertType.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {ModalUpdateActionComponent} from './data/content-modal/modal-update-action/modal-update-action.component';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalUpdateChainActionComponent} from '@main/flow/data/content-modal/modal-update-chain-action/modal-update-chain-action.component';
import {ResultComponent} from '@main/flow/data/components/result/result.component';
import {ModalUpdateResultComponent} from '@main/flow/data/content-modal/modal-update-result/modal-update-result.component';
import {ModalUpdateReasonComponent} from '@main/flow/data/content-modal/modal-update-reason/modal-update-reason.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {ChainDetailComponent} from './chain-detail/chain-detail.component';

@NgModule({
  declarations: [
    FlowComponent,
    RuleComponent,
    DataComponent,
    ActionComponent,
    ChainActionComponent,
    ReasonComponent,
    ResultComponent,
    ModalUpdateActionComponent,
    ModalUpdateChainActionComponent,
    ModalUpdateResultComponent,
    ModalUpdateReasonComponent,
    ChainDetailComponent,
  ],
  imports: [
    CommonModule,
    FlowRoutingModule,
    TabsModule,
    FilterTopTableComponent,
    FormsModule,
    PaginationModule,
    ConvertTypeModule,
    CustomPaginationComponent,
    CustomModalComponent,
    ReactiveFormsModule,
    NgSelectModule,
    ModalConfirmComponent,
    TooltipModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
  ],
})
export class FlowModule {}
