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
import {ICommonDataSource} from '@app/types/viewmodels';

@Component({
  selector: 'app-chain-detail',
  templateUrl: './chain-detail.component.html',
  styleUrls: ['./chain-detail.component.scss'],
})
export class ChainDetailComponent implements OnDestroy {
  @ViewChild('template') template!: TemplateRef<any>;

  public dataSource: ICommonDataSource<any, any> = {
    rows: [
      {
        id: 1,
        name: 'CSKH',
        isExpand: false,
        children: [
          {
            name: 'Gọi lần đầu',
          },
        ],
      },
      {
        id: 2,
        name: 'HDSD',
        isExpand: false,
        children: [
          {
            name: 'Gọi chào hàng',
          },
        ],
      },
    ],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };

  public detailChain = {
    createdBy: {
      id: '640e9043784a12c99281206c',
      name: 'An Hải',
      picture:
        'https://lh3.googleusercontent.com/a/AGNmyxambgm4-ZDfHnWvasN5iTncc0VVGXlp2n21hDOK=s96-c',
      email: 'haian.nt@tinasoft.vn',
    },
    isActive: true,
    createdAt: '2024-01-08T07:59:05.267Z',
    updatedAt: '2024-01-08T07:59:05.358Z',
    id: '659bab49870ed0a5409a5497',
    name: 'CSKH',
    actionResults: [
      {
        id: '659bab49f0652ecf1e8e2a9f',
        ordering: 1,
        action: {
          name: 'string',
          id: '659b7a717c946924af815dee',
        },
        results: [
          {
            ordering: 3,
            nextActions: [
              {
                ordering: 4,
                type: '0',
                delayType: '0',
                action: {
                  name: 'string',
                  id: '659b7a717c946924af815dee',
                },
              },
            ],
            result: {
              name: 'string',
              id: '659bb5b1f7cff15333789fa3',
            },
          },
        ],
      },
    ],
  };

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

  dropRow(value: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
