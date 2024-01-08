import {Component} from '@angular/core';
import {ModalUpdateActionComponent} from '@main/flow/data/content-modal/modal-update-action/modal-update-action.component';
import {ETypeButton, IFilterTopButton} from '@app/types/common';

@Component({
  selector: 'app-chain-detail',
  templateUrl: './chain-detail.component.html',
  styleUrls: ['./chain-detail.component.scss'],
})
export class ChainDetailComponent {
  protected readonly undefined = undefined;
  public configButtons: IFilterTopButton[] = [
    {
      name: 'back',
      type: ETypeButton.DEFAULT,
      label: 'Quay lại',
      icon: './assets/images/icon/back.svg',
    },
    {
      name: 'introduce',
      type: ETypeButton.SUB_PRIMARY,
      label: 'HDSD',
      icon: './assets/images/icon/notebook-primary.svg',
      activeIcon: './assets/images/icon/notebook-white.svg',
    },
    {
      name: 'save',
      type: ETypeButton.PRIMARY,
      label: 'Lưu',
      icon: './assets/images/icon/save.svg',
    },
  ];

  constructor() {}

  handleAction(name: string) {
    if (name === 'reload') {
    }
    if (name === 'add_new') {
    }
  }
}
