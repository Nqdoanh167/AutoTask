import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from './main.component';
import {NotfoundComponent} from '../notfound/notfound.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'task',
        pathMatch: 'full',
      },
      {
        path: 'task',
        loadChildren: () =>
          import('./task/task.module').then((m) => m.TaskModule),
      },
      {
        path: 'flow',
        loadChildren: () =>
          import('./flow/flow.module').then((m) => m.FlowModule),
      },
      {
        path: 'setting',
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
