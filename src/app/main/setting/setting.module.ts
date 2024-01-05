import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingComponent } from './setting.component';
import {SettingRoutingModule} from "./setting-routing.module";
import { PermissionComponent } from './permission/permission.component';



@NgModule({
  declarations: [
    SettingComponent,
    PermissionComponent
  ],
  imports: [
    CommonModule,
    SettingRoutingModule
  ]
})
export class SettingModule { }
