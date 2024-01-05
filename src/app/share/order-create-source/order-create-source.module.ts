import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OrderCreateSourceComponent} from './order-create-source.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [OrderCreateSourceComponent],
  imports: [CommonModule, TooltipModule.forRoot()],
  exports: [OrderCreateSourceComponent],
})
export class OrderCreateSourceModule {}
