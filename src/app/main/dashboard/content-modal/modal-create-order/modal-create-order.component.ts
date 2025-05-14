import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {finalize, Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';

@Component({
  selector: 'app-modal-create-order',
  templateUrl: 'modal-create-order.component.html',
})
export class ModalCreateOrderComponent implements OnInit, OnDestroy {
  @Output() successEvent = new EventEmitter();
  @Input() taskChainResultId!: string;
  @Input() taskId!: string;
  @Input() subActionId!: string;

  protected url!: string;
  private messageHandler: any;
  private bizAlias?: string;
  private destroy$ = new Subject<void>();

  constructor(
    public bsModalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly toastr: ToastrService,
    private authService: AuthService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.alias) {
          this.bizAlias = res?.alias;
        }
      });
  }

  ngOnInit() {
    this.url = `${environment.urlDomain}/${this.bizAlias}/sale-center/order/create?taskId=${this.taskId}`;

    this.messageHandler = (event: MessageEvent) => {
      if (event.origin !== environment.urlDomain) return;

      const message = event.data;
      if (message.name === '__SM_FORM_POPUP') {
        switch (message.action) {
          case 'HIDE':
            console.log('Received HIDE action', message.data);
            const {order} = message.data;
            console.log({order});

            if (order?.id) {
              this.handleCreateOrder(order?.id);
            }
            break;
        }
      }
    };

    // Đăng ký event listener
    window.addEventListener('message', this.messageHandler);
  }

  handleCreateOrder(id: string) {
    this.autoTaskService.taskChainResult
      .manualCreateOrder(this.taskChainResultId, {
        orderId: id,
        subActionId: this.subActionId,
      })
      .pipe(
        finalize(() => {
          this.hideModal();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastr.success('Tạo đơn hàng thành công!!');
            this.successEvent.emit();
          }
        },
      });
  }

  hideModal() {
    this.bsModalRef.hide();
  }

  ngOnDestroy() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
