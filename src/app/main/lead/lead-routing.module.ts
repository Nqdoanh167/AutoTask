import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LeadComponent} from './lead.component';
import {LeadDashboardComponent} from './lead-dashboard/lead-dashboard.component';
import {LeadSettingComponent} from './lead-setting/lead-setting.component';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccessSubModule.guard';
import {EModule, ELeadTab} from '@app/types/viewmodels';

const routes: Routes = [
  {
    path: '',
    component: LeadComponent,
    children: [
      {
        path: '',
        redirectTo: ELeadTab.DASHBOARD,
        pathMatch: 'full',
      },
      {
        path: ELeadTab.DASHBOARD,
        data: {
          mainModule: EModule.LEAD,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: LeadDashboardComponent,
      },
      {
        path: ELeadTab.SETTING,
        data: {
          mainModule: EModule.LEAD,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: LeadSettingComponent,
      },
    ],
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeadRoutingModule {}
