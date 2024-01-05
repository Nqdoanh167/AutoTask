import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HeaderComponent} from './header.component';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {RouterModule} from '@angular/router';
import {LogoModule} from 'smaxapp';
import {BreadcrumbComponent} from '../breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [HeaderComponent, BreadcrumbComponent],
  imports: [CommonModule, RouterModule, LogoModule, BsDropdownModule.forRoot()],
  exports: [HeaderComponent],
})
export class HeaderModule {}
