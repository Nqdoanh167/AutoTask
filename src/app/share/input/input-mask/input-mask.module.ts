import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputMaskComponent} from './input-mask.component';
import {NgxMaskDirective, NgxMaskPipe, provideNgxMask} from 'ngx-mask';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [InputMaskComponent],
  imports: [CommonModule, FormsModule, NgxMaskDirective, NgxMaskPipe],
  exports: [InputMaskComponent],
  providers: [provideNgxMask()],
})
export class InputMaskModule {}
