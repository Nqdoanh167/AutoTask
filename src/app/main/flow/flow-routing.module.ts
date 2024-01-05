import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from "../../notfound/notfound.component";
import {FlowComponent} from "./flow.component";
import {RuleComponent} from "./rule/rule.component";
import {DataComponent} from "./data/data.component";

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
        component: RuleComponent
      },
      {
        path: 'data',
        component: DataComponent
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
