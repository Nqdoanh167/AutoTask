import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownSearchComponent, NgLabelTemplateDirective, NgLabelNullTemplateDirective, NgLabelValueTemplateDirective, NgOptionTemplateDirective } from './dropdown-search.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';



@NgModule({
  declarations: [
    DropdownSearchComponent,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
    NgLabelNullTemplateDirective, NgLabelValueTemplateDirective
  ],
  imports: [
    CommonModule,
    BsDropdownModule.forRoot()
  ],
  exports: [DropdownSearchComponent, NgLabelTemplateDirective, NgOptionTemplateDirective, NgLabelNullTemplateDirective, NgLabelValueTemplateDirective]
})
export class DropdownSearchModule { }
