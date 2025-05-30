import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FilterCheckboxComponent} from './filter-checkbox.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [FilterCheckboxComponent],
  imports: [CommonModule, TooltipModule.forRoot()],
  exports: [FilterCheckboxComponent],
})
export class InputSelectCheckboxModule {}