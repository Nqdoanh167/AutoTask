import {Component} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {ICommonDataSource} from '@app/types/viewmodels';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên nhân viên...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm nhân viên',
      icon: './assets/images/icon/plus.svg',
    },
  ];

  public dataSource: ICommonDataSource<any, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };

  constructor() {}

  getDataSource(isReset?: boolean) {}
  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
    }
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
  }

  handleUpdate(value?: any) {
    //   const modalUpdate = this.modalService.show(ModalUpdateActionComponent, {
    //     initialState: {
    //       sourceData: value,
    //     },
    //   });
    //   modalUpdate?.content?.updateSuccess
    //       .pipe()
    //       .subscribe(() => this.getDataSource());
  }
}
