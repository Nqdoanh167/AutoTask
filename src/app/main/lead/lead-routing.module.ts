import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LeadDashboardComponent} from './lead-dashboard/lead-dashboard.component';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccessSubModule.guard';
import {EModule, ELeadTab} from '@app/types/viewmodels';

const routes: Routes = [
  {
    path: '',
    component: LeadDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: EModule.LEAD,
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
    ],
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeadRoutingModule {}
