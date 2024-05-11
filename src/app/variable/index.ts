import {IColumns, IDataColumns} from '../types/viewmodels';

export const listColumns: IDataColumns = {
  columnDashboard: [
    {
      name: 'Task',
      value: 'name',
      tooltip: 'Task',
    },
    {
      name: 'Hành động - Kết quả',
      value: 'taskChains',
      tooltip: 'Hành động - Kết quả',
    },
    {
      name: 'Khách hàng',
      value: 'leadDeal',
      tooltip: 'Khách hàng',
    },
    {
      name: 'Sản phẩm quản tâm',
      value: 'cart',
      tooltip: 'Sản phẩm quản tâm',
    },
    {
      name: 'Số lượng đơn hàng',
      value: 'orderIds',
      tooltip: 'Số lượng đơn hàng',
    },
    {
      name: 'Nhân viên phụ trách',
      value: 'counselor',
      tooltip: 'Nhân viên phụ trách',
    },
    {
      name: 'Ngày tạo',
      value: 'createdAt',
      tooltip: 'Ngày tạo',
      // fieldSort: 'createdAt',
    },
    {
      name: 'Ngày cập nhật',
      value: 'updatedAt',
      tooltip: 'Ngày cập nhật',
      // fieldSort: 'updatedAt',
    },
    {
      name: 'Người tạo',
      value: 'createdBy',
      tooltip: 'Người tạo',
    },
    {
      name: 'Người cập nhật',
      value: 'updatedBy',
      tooltip: 'Người cập nhật',
    },
   
  ],
};
export const listColumnsDashboardDefault: IColumns[] =
  listColumns.columnDashboard.filter((el) =>
    [
      'name',
      'taskChains',
      'counselor',
      'cart',
      'orderIds',
      'leadDeal',
      'createdAt',
    ].includes(el.value),
  );
