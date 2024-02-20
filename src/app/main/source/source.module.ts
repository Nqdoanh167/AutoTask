import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SourceComponent} from './source.component';
import {SourceRoutingModule} from '@main/source/source-routing.module';

@NgModule({
  declarations: [SourceComponent],
  imports: [CommonModule, SourceRoutingModule],
})
export class SourceModule {}
