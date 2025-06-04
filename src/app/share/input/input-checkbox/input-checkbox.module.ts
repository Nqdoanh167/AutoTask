import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputCheckboxComponent } from './input-checkbox.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [InputCheckboxComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule.forRoot()
  ],
  exports: [
    InputCheckboxComponent
  ]
})
export class InputCheckboxModule { }
