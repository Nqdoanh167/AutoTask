import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainRoutingModule} from './main-routing.module';
import {MainComponent} from './main.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HeaderModule} from '@share/layout/header/header.module';
import {SidebarModule} from '@share/layout/sidebar/sidebar.module';
// component

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
