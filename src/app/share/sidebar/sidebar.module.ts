import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SidebarComponent} from './sidebar.component';
import {RouterModule} from '@angular/router';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {LogoModule} from 'smaxapp';

@NgModule({
  declarations: [SidebarComponent],
  imports: [CommonModule, RouterModule, LogoModule, TooltipModule.forRoot()],
  exports: [SidebarComponent],
})
export class SidebarModule {}
