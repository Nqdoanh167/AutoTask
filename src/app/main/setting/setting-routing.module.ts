import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from '@app/notfound/notfound.component';
import {SettingComponent} from './setting.component';
import {DecentralizationComponent} from '@main/setting/decentralization/decentralization.component';
import {SourceComponent} from '@main/setting/source/source.component';
import {TagComponent} from './tag/tag.component';
import {RoleComponent} from './role/role.component';

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: 'source',
        pathMatch: 'full',
      },
      {
        path: 'source',
        component: SourceComponent,
      },
      {
        path: 'decentralization',
        component: DecentralizationComponent,
      },
      {
        path: 'tag',
        component: TagComponent,
      },
      {
        path: 'role',
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
