import {
  EPerActFlow,
  EPerActSetting,
  EPerActTask,
  EPerActType,
} from '@app/types/setting';
import {DetailTaskData} from '@main/dashboard/content-modal/modal-update-task/detail-task-data';

export class DetailTaskPerms extends DetailTaskData {
  public permissions = {
    canEditAction: false,
    canEditChain: false,
    canEditDeadline: false,
    canCreateOrder: false,
    canEditTask: false,
    canGetTag: false,
  };

  constructor() {
    super();
  }

  private hasPermission(permissions: any[], permission: any): boolean {
    return permissions?.some((per) => per === permission);
  }

  handleCheckPermission() {
    const taskPermissions = this.authService.getUserPerByType(EPerActType.TASK);
    const flowPermissions = this.authService.getUserPerByType(EPerActType.FLOW);
    const settingPermissions = this.authService.getUserPerByType(
      EPerActType.SETTING,
    );
    this.permissions.canEditTask = this.hasPermission(
      taskPermissions,
      EPerActTask.UPDATE_TASK,
    );
    this.permissions.canEditChain = this.hasPermission(
      taskPermissions,
      EPerActTask.MANAGE_CHAIN,
    );
    this.permissions.canEditAction = this.hasPermission(
      taskPermissions,
      EPerActTask.MANAGE_ACTION,
    );
    this.permissions.canEditDeadline = this.hasPermission(
      taskPermissions,
      EPerActTask.EDIT_TIME_ACTION,
    );
    if (
      settingPermissions.some((per) =>
        [
          EPerActSetting.VIEW_TAG_SETTING,
          EPerActSetting.UPDATE_TAG_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getTag();
    }
    if (
      settingPermissions.some((per) =>
        [
          EPerActSetting.VIEW_SOURCE_SETTING,
          EPerActSetting.UPDATE_SOURCE_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getSource();
    }
    if (
      settingPermissions.some((per) =>
        [
          EPerActSetting.VIEW_ROLE_SETTING,
          EPerActSetting.UPDATE_ROLE_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getAutoTaskSetting();
    }
    if (
      flowPermissions.some((per) =>
        [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW].includes(
          per as EPerActFlow,
        ),
      )
    ) {
      this.getActionChain();
      this.getResult();
      this.getAction();
    }
  }
}
