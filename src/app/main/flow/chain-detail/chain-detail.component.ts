import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {ModalUpdateActionComponent} from '@main/flow/data/content-modal/modal-update-action/modal-update-action.component';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {Router} from '@angular/router';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {environment} from '../../../../environments/environment';
import {BizService} from '@app/services/api/biz.service';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-chain-detail',
  templateUrl: './chain-detail.component.html',
  styleUrls: ['./chain-detail.component.scss'],
})
export class ChainDetailComponent implements OnDestroy {
  @ViewChild('template') template!: TemplateRef<any>;

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

  public introductionModalRef?: BsModalRef;
  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly router: Router,
    private readonly modalService: BsModalService,
    private authService: AuthService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.currentBiz = res.alias || '';
        }
      });
  }

  handleAction(name: string) {
    if (name === 'back') {
      this.router.navigate(['/config/rule']);
    }
    if (name === 'introduce') {
      this.introductionModalRef = this.modalService.show(this.template, {
        class: 'modal-lg',
      });
    }
  }

  handleNavigate() {
    const url = `${environment.urlDomain}/${this.currentBiz}/config/data`;
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
