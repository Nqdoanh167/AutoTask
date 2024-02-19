import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FilterDataPipe} from './filter-data.pipe';

@NgModule({
  declarations: [FilterDataPipe],
  imports: [CommonModule],
  exports: [FilterDataPipe],
})
export class FilterDataModule {}
