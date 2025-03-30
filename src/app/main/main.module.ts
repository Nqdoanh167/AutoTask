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
import {ConnectPhoneComponent} from '@share/common/connect-phone/connect-phone.component';
import {ModalCallInComponent} from "@share/common/modal-call-in/modal-call-in.component";
import {QuickCallComponent} from "@share/common/quick-call/quick-call.component";
import {ModalCallOutComponent} from "@share/common/modal-call-out/modal-call-out.component";
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
    ConnectPhoneComponent,
    ModalCallInComponent,
    QuickCallComponent,
    ModalCallOutComponent
  ],
})
export class MainModule {}
