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
  ],
})
export class FlowModule {}
