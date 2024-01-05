import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputSelectComponent } from './input-select.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [InputSelectComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    InputSelectComponent
  ]
})
export class InputSelectModule { }
