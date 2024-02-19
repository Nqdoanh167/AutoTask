import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SearchFilterPipe} from './searchFilter.pipe';
@NgModule({
  declarations: [SearchFilterPipe],
  imports: [CommonModule],
  exports: [SearchFilterPipe],
})
export class SearchFilterModule {}
