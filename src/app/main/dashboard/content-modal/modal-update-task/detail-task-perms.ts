import {EPerActTask, EPerActType} from '@app/types/setting';
import {DetailTaskData} from '@main/dashboard/content-modal/modal-update-task/detail-task-data';

export class DetailTaskPerms extends DetailTaskData {
  public permissions = {
    canEditAction: false,
    canEditChain: false,
    canEditDeadline: false,
    canCreateOrder: false,
    canEditTask: true,
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
    // this.permissions.canEditTask = this.hasPermission(
    //   taskPermissions,
    //   EPerActTask.UPDATE_TASK,
    // );
    this.permissions.canEditChain = this.hasPermission(
      taskPermissions,
      EPerActTask.MANAGE_CHAIN,
    );
    this.permissions.canEditAction = this.hasPermission(
      taskPermissions,
      EPerActTask.MANAGE_CHAIN,
    );
    this.permissions.canEditDeadline = this.hasPermission(
      taskPermissions,
      EPerActTask.EDIT_TIME_ACTION,
    );

    // // this.getTag();
    // this.getSource();
    // this.getActionChain();
    // this.getResult();
    // this.getAction();
    this.clickLoadData('results')
    this.clickLoadData('actionChains')
    this.clickLoadData('sources')
    this.clickLoadData('actions')
  }
}
