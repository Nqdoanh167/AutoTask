import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderableTableComponent } from './orderable-table.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { DraggableItemService, SortableModule } from 'ngx-bootstrap/sortable';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';




@NgModule({
  declarations: [OrderableTableComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SortableModule,
    BsDropdownModule.forRoot()
  ],
  providers: [
    DraggableItemService,
  ],
  exports: [
    OrderableTableComponent
  ]
})
export class OrderableTableModule { }
