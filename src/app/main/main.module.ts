import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainRoutingModule} from './main-routing.module';
import {MainComponent} from './main.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HeaderModule} from '@share/layout/header/header.module';
import {SidebarModule} from '@share/layout/sidebar/sidebar.module';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {PhoneCallPopUpComponent} from '@share/common/phone-call-pop-up/phone-call-pop-up.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
// component

@NgModule({
  declarations: [MainComponent],
  imports: [
    MainRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HeaderModule,
    SidebarModule,
    ModalConfirmComponent,
    PhoneCallPopUpComponent,
    TooltipModule,
    BsDropdownModule,
  ],
})
export class MainModule {}
