import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainRoutingModule} from './main-routing.module';
import {MainComponent} from './main.component';
import {HeaderModule} from '../share/header/header.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
// component
import {SidebarModule} from '../share/sidebar/sidebar.module';

@NgModule({
  declarations: [MainComponent],
  imports: [
    MainRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderModule,
    SidebarModule,
  ],
})
export class MainModule {}
