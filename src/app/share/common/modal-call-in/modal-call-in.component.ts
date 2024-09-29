import {ChangeDetectorRef, Component, OnDestroy, OnInit} from "@angular/core";
import {BaseComponentsComponent} from "@share/common/base-components/base-components.component";
import {CommonModule} from "@angular/common";
import {CallCustomerInfoComponent} from "@share/common/call-customer-info/call-customer-info.component";
import {Customer} from "@app/types/customer";
import {takeUntil} from "rxjs/operators";
import {CustomerService} from "@app/services/api/customer.service";
import {CommonService} from "@app/services/common/common.service";
import {Call, ECallType, ECallStatus} from "@app/types/call";
import {Observable, timer} from "rxjs";
import {PhoneCallService} from "@app/services/common/phone-call.service";
import {StringeeService} from "@app/services/common/stringee.service";
import {EStatusVoice} from "@app/types/sms-ott-call";

@Component({
    selector: 'app-common-modal-call-in',
    standalone: true,
    imports: [CommonModule, CallCustomerInfoComponent],
    templateUrl: './modal-call-in.component.html',
    styleUrls: ['../modal-call/modal-call.component.scss'],
})
export class ModalCallInComponent extends BaseComponentsComponent implements OnInit, OnDestroy {
    showInfo = false;
    collapsed = false;
    public customer: Customer | null = null;
    public call$?: Observable<Call | null>;
    public phoneStatus?: ECallStatus;
    public showPopup = true;
    public isSilent = false;
    public isMute = false;
    public timer$ = timer(0, 1000);
    protected readonly ECallStatus = ECallStatus;
    call: any = null;
    mobile = '';

    constructor(
        private readonly customerService: CustomerService,
        private readonly commonService: CommonService,
        private readonly cdr: ChangeDetectorRef,
        private readonly phoneCallService: PhoneCallService,
        private readonly stringeeService: StringeeService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.call$ = this.phoneCallService.getIncomingCall();

        this.call$.pipe(takeUntil(this.destroy$)).subscribe((call) => {
            if (call) {
                this.phoneStatus = call?.status;
                this.handleCheckCallStatus();

                this.mobile = call.to;
                if (this.mobile.startsWith('84')) {
                    this.mobile = this.mobile.replace('84', '0');
                }
                this.searchCustomer()
            } else {
                this.isSilent = false;
                this.isMute = false;
            }
        });
    }

    handleCheckCallStatus() {
        if ([ECallStatus.ENDED, ECallStatus.REJECTED].includes(this.phoneStatus!)) {
            const subscribe = this.timer$.subscribe((val) => console.log(val));
            subscribe.unsubscribe();
            setTimeout(
                () => {
                    this.showPopup = this.isMute = this.isSilent = false;
                    this.phoneCallService.setIncomingCall(null);
                    this.stringeeService.callStopped();
                },
                // this.phoneStatus === ECallStatus.ENDED ? 2000 : 0,
                1000,
            );
        } else {
            this.showPopup = true;
        }
    }

    handleChangePhoneStatus(status: ECallStatus) {
        this.phoneCallService.updateStatusIncomingCall(status);
        if (status === ECallStatus.ANSWERED) {
            this.phoneCallService.updateHistoricalCallStatus(EStatusVoice.SUCCESS);
            this.stringeeService.handleAnswer();
            return;
        }
        if (status === ECallStatus.HANGUP) {
            this.stringeeService.handleHangup();
            return;
        }
        if (this.phoneStatus === ECallStatus.ENDED) {
            this.stringeeService.handleHangup();
            return;
        }
        if (status === ECallStatus.REJECTED) {
            this.phoneCallService.updateHistoricalCallStatus(EStatusVoice.REJECT);
            this.stringeeService.handleReject();
            return;
        }
    }


    resetState() {
        this.showInfo = false;
        this.collapsed = false;
        this.customer = null;
    }

    searchCustomer() {
        this.customerService.customer.get({q: this.mobile}).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (res) => {
                if (res && res.status === 200) {
                    if (res.data[0]) {
                        this.getCustomerInfo(res.data[0].id);
                    }
                } else {
                    this.commonService.handleResErr(res);
                }
            },
        });
    }

    getCustomerInfo(id: string) {
        this.customerService.customer.getById(id).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (res) => {
                if (res && res.status === 200) {
                    if (res.data) {
                        this.customer = res.data;
                    }
                } else {
                    this.commonService.handleResErr(res);
                }
            },
        });
    }

    changeCollapse() {
        this.collapsed = !this.collapsed;

        if (this.collapsed) {
            this.showInfo = false;
        }
    }
}