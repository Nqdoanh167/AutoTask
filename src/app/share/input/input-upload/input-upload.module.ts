import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputUploadComponent} from './input-upload.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [InputUploadComponent],
  imports: [CommonModule, FormsModule],
  exports: [InputUploadComponent],
})
export class InputUploadModule {}
