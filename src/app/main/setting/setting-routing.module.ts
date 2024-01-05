import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotfoundComponent} from "../../notfound/notfound.component";
import {SettingComponent} from "./setting.component";

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
  },
  {path: '**', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingRoutingModule {}
