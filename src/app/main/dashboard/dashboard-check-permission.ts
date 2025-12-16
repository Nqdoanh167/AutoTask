import {DashboardData} from '@main/dashboard/dashboard-data';
import {
  TASK_FLOWS_CONFIG_FILTERS,
  TASK_SOURCE_SETTING_CONFIG_FILTERS,
} from '@main/dashboard/dashboard-variables';

export class DashboardCheckPermission extends DashboardData {
  public permission = {
    add: false,
    edit: false,
    delete: false,
    viewDuplicatedPhoneConfig: false,
  };

  constructor() {
    super();
    this.handleCheckPermission();
  }

  handleCheckPermission() {
    // this.getActionChain();
    // this.getResult();
    // this.getAction();
    // this.getSource();
    // this.getTag();
    this.configFilters = [...this.configFilters, ...TASK_FLOWS_CONFIG_FILTERS];
    this.configFilters = [
      ...this.configFilters,
      ...TASK_SOURCE_SETTING_CONFIG_FILTERS,
    ];
    this.configFilters = [
      ...this.configFilters,
    ];
  }

  hasPermission(permissions: any[], permission: any): boolean {
    return permissions?.some((per) => per === permission);
  }
}
