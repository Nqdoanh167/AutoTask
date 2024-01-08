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
      name: 'reload',
      type: ETypeButton.DEFAULT,
      label: 'Quay lại',
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'introduce',
      type: ETypeButton.SUB_PRIMARY,
      label: 'HDSD',
      icon: './assets/images/icon/reload-primary.svg',
      activeIcon: './assets/images/icon/reload-white.svg',
    },
    {
      name: 'save',
      type: ETypeButton.PRIMARY,
      label: 'Lưu',
      icon: './assets/images/icon/plus.svg',
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
