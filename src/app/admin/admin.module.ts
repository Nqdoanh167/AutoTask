import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminComponent} from './admin.component';
import {AdminRoutingModule} from './admin-routing.module';
import {HeaderModule} from '../share/header/header.module';
// import { SidebarAdminModule } from 'src/app/share/sidebar-admin/sidebar-admin.module';

@NgModule({
  declarations: [AdminComponent],
  imports: [CommonModule, AdminRoutingModule, HeaderModule],
})
export class AdminModule {}
