import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputCheckboxComponent } from './input-checkbox.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';



@NgModule({
  declarations: [InputCheckboxComponent
  ],
  imports: [
    CommonModule,
    TooltipModule.forRoot()
  ],
  exports: [
    InputCheckboxComponent
  ]
})
export class InputCheckboxModule { }
