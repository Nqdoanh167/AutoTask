import {DashboardData} from '@main/dashboard/dashboard-data';
import {EPerActFlow, EPerActSetting, EPerActType} from '@app/types/setting';
import {
  TASK_FLOWS_CONFIG_FILTERS,
  TASK_SOURCE_SETTING_CONFIG_FILTERS,
  TASK_TAG_SETTING_CONFIG_FILTERS,
} from '@main/dashboard/dashboard-variables';

export class DashboardCheckPermission extends DashboardData {
  public permission = {
    add: false,
    edit: false,
    delete: false,
  };

  constructor() {
    super();
  }

  handleCheckPermission() {
    const permissions = [
      ...this.authService.getUserPerByType(EPerActType.TASK),
      ...this.authService.getUserPerByType(EPerActType.SETTING),
      ...this.authService.getUserPerByType(EPerActType.FLOW),
    ];
    if (
      permissions.some((per) =>
        [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW].includes(
          per as EPerActFlow,
        ),
      )
    ) {
      this.getActionChain();
      this.getResult();
      this.getAction();
      this.configFilters = [
        ...this.configFilters,
        ...TASK_FLOWS_CONFIG_FILTERS,
      ];
    }
    if (
      permissions.some((per) =>
        [
          EPerActSetting.VIEW_SOURCE_SETTING,
          EPerActSetting.UPDATE_SOURCE_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getSource();
      this.configFilters = [
        ...this.configFilters,
        ...TASK_SOURCE_SETTING_CONFIG_FILTERS,
      ];
    }
    if (
      permissions.some((per) =>
        [
          EPerActSetting.VIEW_TAG_SETTING,
          EPerActSetting.UPDATE_TAG_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getTag();
      this.configFilters = [
        ...this.configFilters,
        ...TASK_TAG_SETTING_CONFIG_FILTERS,
      ];
    }
  }

  hasPermission(permissions: any[], permission: any): boolean {
    return permissions?.some((per) => per === permission);
  }
}
