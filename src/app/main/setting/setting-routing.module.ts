import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {SettingComponent} from './setting.component';
import {DecentralizationComponent} from '@main/setting/decentralization/decentralization.component';
import {SourceComponent} from '@main/setting/source/source.component';
import {TagComponent} from './tag/tag.component';
import {RoleComponent} from './role/role.component';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccessSubModule.guard';
import {EModule, ESettingTab} from '@app/types/viewmodels';
import {DivideComponent} from './divide/divide.component';
import {StatusLeadComponent} from './status-lead/status-lead.component';

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
        component: SourceComponent,
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
      {
        path: ESettingTab.DIVIDE,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: DivideComponent,
      },
      {
        path: ESettingTab.STATUS_LEAD,
        data: {
          mainModule: EModule.SETTING,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: StatusLeadComponent,
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
