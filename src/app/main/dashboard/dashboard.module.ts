import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from './dashboard.component';
import {TaskRoutingModule} from './task-routing.module';

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, TaskRoutingModule],
})
export class DashboardModule {}
