import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from './main.component';
import {NotfoundComponent} from '../notfound/notfound.component';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccess.guard';
import {EModule} from '@app/types/viewmodels';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: EModule.DASHBOARD,
        pathMatch: 'full',
      },
      {
        path: EModule.DASHBOARD,
        canActivate: [HasPermissionAccessModuleGuard],
        data: {},
        loadChildren: () =>
          import('@main/dashboard/dashboard.module').then(
            (m) => m.DashboardModule,
          ),
      },
      {
        path: EModule.CONFIG,
        canActivate: [HasPermissionAccessModuleGuard],
        loadChildren: () =>
          import('./flow/flow.module').then((m) => m.FlowModule),
      },
      {
        path: EModule.SETTING,
        canActivate: [HasPermissionAccessModuleGuard],
        loadChildren: () =>
          import('./setting/setting.module').then((m) => m.SettingModule),
      },
    ],
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
