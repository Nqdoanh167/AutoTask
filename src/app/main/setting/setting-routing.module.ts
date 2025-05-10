import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {SettingComponent} from './setting.component';
import {DecentralizationComponent} from '@main/setting/decentralization/decentralization.component';
import {SourceComponent} from '@main/setting/source-v2/source.component';
import {TagComponent} from './tag/tag.component';
import {RoleComponent} from './role/role.component';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccessSubModule.guard';
import {EModule, ESettingTab} from '@app/types/viewmodels';

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: ESettingTab.SOURCE,
        pathMatch: 'full',
      },
      {
        path: ESettingTab.SOURCE,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        // component: SourceComponent,
        loadChildren: () =>
          import('@main/setting/source-v2/source.module').then(
            (m) => m.SourceModule,
          ),
      },
      {
        path: ESettingTab.DECENTRALIZATION,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: DecentralizationComponent,
      },
      {
        path: ESettingTab.TAG,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: TagComponent,
      },
      {
        path: ESettingTab.ROLE,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: RoleComponent,
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
