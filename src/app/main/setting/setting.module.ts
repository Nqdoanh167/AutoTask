import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingComponent} from './setting.component';
import {SettingRoutingModule} from './setting-routing.module';
import {PermissionComponent} from './permission/permission.component';
import {EmployeeComponent} from './employee/employee.component';
import {BranchComponent} from './branch/branch.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {PipeTimeViewModule} from '@share/pipe/timeView.module';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';

@NgModule({
  declarations: [
    SettingComponent,
    PermissionComponent,
    EmployeeComponent,
    BranchComponent,
  ],
  imports: [
    CommonModule,
    SettingRoutingModule,
    FilterTopTableComponent,
    PipeTimeViewModule,
    FallbackImageModule,
  ],
})
export class SettingModule {}
