import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from "../../notfound/notfound.component";
import {SettingComponent} from "./setting.component";
import {PermissionComponent} from "./permission/permission.component";

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: 'permission',
        pathMatch: 'full',
      },
      {
        path: 'permission',
        component: PermissionComponent
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
