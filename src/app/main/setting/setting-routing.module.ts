import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {SettingComponent} from './setting.component';
import {PermissionComponent} from './permission/permission.component';
import {EmployeeComponent} from '@main/setting/employee/employee.component';
import {BranchComponent} from '@main/setting/branch/branch.component';

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: 'employee',
        pathMatch: 'full',
      },
      {
        path: 'employee',
        component: EmployeeComponent,
      },
      {
        path: 'permission',
        component: PermissionComponent,
      },
      {
        path: 'branch',
        component: BranchComponent,
      },
    ],
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingRoutingModule {}
