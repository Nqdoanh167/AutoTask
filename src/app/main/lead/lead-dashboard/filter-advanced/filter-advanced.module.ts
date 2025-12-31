import {PopoverModule} from 'ngx-bootstrap/popover';
import {FilterAdvancedComponent} from './filter-advanced.component';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule} from '@angular/forms';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';
import {CustomDatePickerComponent} from '@share/custom/custom-date-picker/custom-date-picker.component';

@NgModule({
  declarations: [FilterAdvancedComponent],
  imports: [
    CommonModule,
    PopoverModule,
    TooltipModule.forRoot(),
    NgSelectModule,
    FormsModule,
    CustomSelectSearchComponent,
    CustomDatePickerComponent,
  ],
  exports: [FilterAdvancedComponent],
})
export class FilterAdvancedModule {}
