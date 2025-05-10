import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SourceComponent} from './source.component';
import {SourceRoutingModule} from './source-routing.module';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalModule} from 'ngx-bootstrap/modal';
import {NgSelectModule} from '@ng-select/ng-select';
import {InputUploadModule} from 'src/app/share/input/input-upload/input-upload.module';

@NgModule({
  declarations: [SourceComponent],
  imports: [
    CommonModule,
    SourceRoutingModule,
    // HeaderModule,
    InputUploadModule,
    ReactiveFormsModule,
    NgSelectModule,
    ModalModule.forRoot(),
  ],
})
export class SourceModule {}
