import { NgModule } from '@angular/core';
import { MycurrencyPipe } from './mycurrency.pipe';

@NgModule({
  declarations: [MycurrencyPipe],
  exports: [MycurrencyPipe],
})
export class MycurrencyModule {}