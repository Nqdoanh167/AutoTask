import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlowComponent} from './flow.component';
import {FlowRoutingModule} from './flow-routing.module';
import {RuleComponent} from './rule/rule.component';
import {DataComponent} from './data/data.component';

@NgModule({
  declarations: [FlowComponent, RuleComponent, DataComponent],
  imports: [CommonModule, FlowRoutingModule],
})
export class FlowModule {}
