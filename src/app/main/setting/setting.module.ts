import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingComponent} from './setting.component';
import {SettingRoutingModule} from './setting-routing.module';
import {DecentralizationComponent} from '@main/setting/decentralization/decentralization.component';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';
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
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {StandardDataSizeComponent} from '@share/common/standard-data-size/standard-data-size.component';
import {CdkDropList} from '@angular/cdk/drag-drop';
import {ModalEmployeeInfoComponent} from '@main/setting/modal-contents/modal-employee-info/modal-employee-info.component';
import {AddEditPermissionComponent} from '@main/setting/modal-contents/add-edit-permission/add-edit-permission.component';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {InputUploadModule} from '@share/input/input-upload/input-upload.module';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {TreeSelectModule} from 'primeng/treeselect';
import {TimeViewPipe} from '@share/pipe/timeView.pipe';
import {GetDataArrayPipe} from '@share/pipe/get-data-array/getDataArray.pipe';
import {LetDirective} from '@share/directive/ng-let.directive';
import {DivideComponent} from './divide/divide.component';
import {ModalUpdateDivideComponent} from './divide/modal-update-divide/modal-update-divide.component';
import {ModalModule} from 'ngx-bootstrap/modal';
import {InputMaskModule} from '../../share/input/input-mask/input-mask.module';
import {FilterDataModule} from '@app/share/pipe/filter-data/filter-data.module';
import { CustomInputRangeTime } from "../../share/custom/custom-time-picker.component.ts/custom-input-range-time.component";

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
    DivideComponent,
    ModalUpdateDivideComponent,
  ],
  imports: [
    CommonModule,
    SettingRoutingModule,
    FilterTopTableComponent,
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
    StandardTableComponent,
    StandardDataSizeComponent,
    CdkDropList,
    AccordionModule,
    InputUploadModule,
    BsDropdownModule,
    PopoverModule,
    TreeSelectModule,
    TimeViewPipe,
    GetDataArrayPipe,
    LetDirective,
    ModalModule.forRoot(),
    InputMaskModule,
    FilterDataModule,
    CustomInputRangeTime
],
})
export class SettingModule {}
