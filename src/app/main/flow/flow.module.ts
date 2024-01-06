import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlowComponent} from './flow.component';
import {FlowRoutingModule} from './flow-routing.module';
import {RuleComponent} from './rule/rule.component';
import {DataComponent} from './data/data.component';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {ActionComponent} from './data/components/action/action.component';
import {ChainActionComponent} from './data/components/chain-action/chain-action.component';
import {ResultComponent} from './data/components/result/result.component';
import {ReasonComponent} from './data/components/reason/reason.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {FormsModule} from '@angular/forms';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {ConvertTypeModule} from '@share/pipe/convertType/convertType.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';

@NgModule({
  declarations: [
    FlowComponent,
    RuleComponent,
    DataComponent,
    ActionComponent,
    ChainActionComponent,
    ResultComponent,
    ReasonComponent,
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
  ],
})
export class FlowModule {}
