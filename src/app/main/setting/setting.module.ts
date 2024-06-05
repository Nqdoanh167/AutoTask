import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingComponent} from './setting.component';
import {SettingRoutingModule} from './setting-routing.module';
import {DecentralizationComponent} from '@main/setting/decentralization/decentralization.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {PipeTimeViewModule} from '@share/pipe/timeView.module';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';
import {ModalEmployeeInfoComponent} from './components/modal-employee-info/modal-employee-info.component';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {SourceComponent} from './source/source.component';
import {CustomPaginationComponent} from '@share/custom/custom-pagination/custom-pagination.component';
import {ModalConfirmComponent} from '@share/custom/modal-confirm/modal-confirm.component';
import {UpdateSourceComponent} from '@main/setting/source/content-modal/update-source/update-source.component';
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ConvertTypeModule} from '@share/pipe/convertType/convertType.module';
import {TagComponent} from './tag/tag.component';
import {RoleComponent} from './role/role.component';
import {EmployeeComponent} from '@main/setting/decentralization/components/employee/employee.component';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {PermissionsComponent} from '@main/setting/decentralization/components/permissions/permissions.component';
import {AddEditPermissionComponent} from './decentralization/modal-contents/add-edit-permission/add-edit-permission.component';
import {AddEditEmployeePermissionComponent} from './decentralization/modal-contents/add-edit-employee-permission/add-edit-employee-permission.component';

@NgModule({
  declarations: [
    SettingComponent,
    TagComponent,
    DecentralizationComponent,
    ModalEmployeeInfoComponent,
    SourceComponent,
    RoleComponent,
    UpdateSourceComponent,
    PermissionsComponent,
    EmployeeComponent,
    AddEditPermissionComponent,
    AddEditEmployeePermissionComponent,
  ],
  imports: [
    CommonModule,
    SettingRoutingModule,
    FilterTopTableComponent,
    PipeTimeViewModule,
    FallbackImageModule,
    CustomModalComponent,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    CustomPaginationComponent,
    ModalConfirmComponent,
    CustomButtonLoadingComponent,
    TooltipModule,
    ConvertTypeModule,
    TabsModule,
  ],
})
export class SettingModule {}
