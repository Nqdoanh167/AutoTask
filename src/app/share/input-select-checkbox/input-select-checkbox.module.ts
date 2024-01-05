import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputSelectCheckboxComponent} from './input-select-checkbox.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [InputSelectCheckboxComponent],
  imports: [CommonModule, TooltipModule.forRoot()],
  exports: [InputSelectCheckboxComponent],
})
export class InputSelectCheckboxModule {}
