import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { InputEditorComponent } from './input-editor.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [InputEditorComponent],
  imports: [
    CommonModule,
    CKEditorModule,
    FormsModule,
  ],
  exports: [InputEditorComponent]
})
export class InputEditorModule { }
