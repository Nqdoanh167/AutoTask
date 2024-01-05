import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowComponent } from './flow.component';
import {FlowRoutingModule} from "./flow-routing.module";



@NgModule({
  declarations: [
    FlowComponent
  ],
  imports: [
    CommonModule,
    FlowRoutingModule
  ]
})
export class FlowModule { }
