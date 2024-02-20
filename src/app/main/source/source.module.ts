import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SourceComponent} from './source.component';
import {SourceRoutingModule} from '@main/source/source-routing.module';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {PipeTimeViewModule} from '@share/pipe/timeView.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {UpdateSourceComponent} from './content-modal/update-source/update-source.component';
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';

@NgModule({
  declarations: [SourceComponent, UpdateSourceComponent],
  imports: [
    CommonModule,
    SourceRoutingModule,
    CustomPaginationComponent,
    FallbackImageModule,
    FilterTopTableComponent,
    ModalConfirmComponent,
    PipeTimeViewModule,
    TooltipModule,
    CustomButtonLoadingComponent,
    CustomModalComponent,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
  ],
})
export class SourceModule {}
