import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from "../../notfound/notfound.component";
import {FlowComponent} from "./flow.component";

const routes: Routes = [
  {
    path: '',
    component: FlowComponent,
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FlowRoutingModule {}
