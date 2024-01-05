import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomModalConfirmComponent} from './custom-modal-confirm.component';

@NgModule({
  declarations: [CustomModalConfirmComponent],
  imports: [CommonModule],
  exports: [CustomModalConfirmComponent],
})
export class CustomModalConfirmModule {}
