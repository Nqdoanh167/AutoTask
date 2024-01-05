import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TaskComponent} from "./task.component";
import {NotfoundComponent} from "../../notfound/notfound.component";

const routes: Routes = [
  {
    path: '',
    component: TaskComponent,
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskRoutingModule {}
