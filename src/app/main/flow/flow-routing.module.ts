import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {FlowComponent} from './flow.component';
import {RuleComponent} from './rule/rule.component';
import {DataComponent} from './data/data.component';
import {ChainDetailComponent} from '@main/flow/chain-detail/chain-detail.component';
import {EModule} from '@app/types/viewmodels';
import {HasPermissionAccessModuleGuard} from '@app/services/guard/hasPermissionAccessSubModule.guard';

const routes: Routes = [
  {
    path: '',
    component: FlowComponent,
    children: [
      {
        path: '',
        redirectTo: 'rule',
        pathMatch: 'full',
      },
      {
        path: 'rule',
        data: {
          mainModule: EModule.CONFIG,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        children: [
          {
            path: ':id',
            component: ChainDetailComponent,
          },
          {
            path: '',
            component: RuleComponent,
          },
        ],
      },
      {
        path: 'data',
        data: {
          mainModule: EModule.CONFIG,
        },
        canActivate: [HasPermissionAccessModuleGuard],
        component: DataComponent,
      },
    ],
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FlowRoutingModule {}
