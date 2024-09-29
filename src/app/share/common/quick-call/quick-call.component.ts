import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {CallCustomerInfoComponent} from "@share/common/call-customer-info/call-customer-info.component";
import {BaseComponentsComponent} from "@share/common/base-components/base-components.component";
import {FormsModule} from "@angular/forms";
import {CustomerService} from "@app/services/api/customer.service";
import {CommonService} from "@app/services/common/common.service";
import {SmsOttCallService} from "@app/services/api/smsOttCall.service";
import {takeUntil} from "rxjs/operators";
import {CustomPaginationComponent} from "@share/custom/custom-pagination/custom-pagination.component";
import {Customer} from "@app/types/customer";
import {PhoneCallService} from "@app/services/common/phone-call.service";
import {ILeadDealDto, ITask} from "@app/types/flow";
import {ManageMappingPhone} from "@app/types/sms-ott-call";
import {StringeeService} from "@app/services/common/stringee.service";
import {OmiExtension} from "@app/types/omicall";
import {User} from "@app/types/viewmodels";
import {ToastrService} from "ngx-toastr";
import {STATUS_VOICE, CALL_EVENT, ECallEvent} from "@app/types/call";


declare function omicallInit(dataConfig: OmiExtension): void;
declare function omicallMakeCall(
    phoneNumber: string,
    hotline: any,
    user?: User,
    taskId?: string,
    taskCode?: string,
): void;

@Component({
    selector: 'app-common-quick-call',
    standalone: true,
    imports: [CommonModule, CallCustomerInfoComponent, FormsModule, CustomPaginationComponent],
    templateUrl: './quick-call.component.html',
    styleUrls: ['./quick-call.component.scss'],
})
export class QuickCallComponent extends BaseComponentsComponent implements OnInit, OnDestroy {
    showCall = false;
    showInfo = false;
    tab = 1;
    mobile: string | undefined = '';
    conditions = {
        type: '',
        status: ''
    };
    histories : any[] = [];
    pagination: any = {
        page: 1,
        limit: 5,
        total: 0
    };
    public customer: Customer | null = null;
    customerTask!: ILeadDealDto;
    task!: ITask;
    connectedPhone: ManageMappingPhone | null | undefined = null;
    STATUS_VOICE = STATUS_VOICE;
    CALL_EVENT = CALL_EVENT;
    ECallEvent = ECallEvent;
    customerMobile: string | undefined = '';

    constructor(
        private readonly customerService: CustomerService,
        private readonly callService: SmsOttCallService,
        private readonly commonService: CommonService,
        private readonly phoneCallService: PhoneCallService,
        private readonly smsOttCallService: SmsOttCallService,
        private readonly stringeeService: StringeeService,
        private readonly toastr: ToastrService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.phoneCallService.getMakeCall().pipe(
            takeUntil(this.destroy$)
        ).subscribe(data => {
            this.customerTask = data.customer;
            this.task = data.task;
            this.connectedPhone = data.connectedPhone;

            this.mobile = this.customerTask.phone;
            this.initToken();
            this.showCall = true;
        })

        this.phoneCallService.connectedPhone$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(data => {
            this.connectedPhone = data;

            if (this.connectedPhone) {
                this.initToken();
            }
        })
    }

    initToken() {
        if (this.connectedPhone) {
            const {platform} = this.connectedPhone;
            switch (platform.platform) {
                case 'stringee':
                    this.getTokenClient();
                    break;
                default:
                    break;
            }
        }
    }

    getTokenClient() {
        const platformId = this.connectedPhone?.platform?.id;
        if (!platformId) return;
        this.smsOttCallService.platform
            .getTokenClient(platformId, 'stringee', this.task?.code!)
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (res : any) => {
                    if (res.status === 200) {
                        this.stringeeService.loginStringee(res.data.token);
                    } else {
                        this.commonService.handleResErr(res);
                    }
                },
            });
    }

    addNum(num: string) {
        this.mobile += num;
    }

    handleCall() {
        if (!this.connectedPhone) return;

        const phone = this.connectedPhone.hotline;
        const toPhone = this.mobile;
        if (!phone || !toPhone) return;
        const {platform} = this.connectedPhone;
        if (platform.platform === 'stringee') {
            this.stringeeService.handleCall(phone, toPhone);
        } else {
            const {id, code, leadDeal} = this.task;
            omicallMakeCall(toPhone, phone, leadDeal as any, id, code);
        }
    }

    onSelectHistory(history: any) {
        if (history.typeCallEvent == ECallEvent.outbound) {
            this.customerMobile = history.voice.toPhone;
        } else {
            this.customerMobile = history.voice.fromPhone;
        }

        if (this.customerMobile) {
            if (this.customerMobile.startsWith('84')) {
                this.customerMobile = this.customerMobile.replace('84', '0');
            }
            this.showInfo = true;
            this.searchCustomer();
        } else {
            this.toastr.warning('Chưa có thông tin khách hàng');
            this.showInfo = false;
        }
    }

    getCallHistory() {
        if (!this.connectedPhone) {
            this.toastr.warning('Bạn chưa kết nối đầu số');
            return;
        }

        if (!this.currentUser) {
            return;
        }

        const conditions: any = {
            page: this.pagination.page,
            limit: this.pagination.limit
        };

        const objFilter: any = {
            'platform.platform_in': [this.connectedPhone.platform.platform],
            'author.id_in': this.currentUser.id
        };

        if (conditions.status) {
            objFilter['voice.status_in'] = conditions.status;
        }

        if (conditions.type) {
            objFilter['voice.typeCallEvent'] = conditions.type;
        }

        conditions.filter = JSON.stringify(objFilter);
        this.callService.history.get(conditions).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (res) => {
                if (res && res.status === 200) {
                    this.histories = res.data;
                    this.pagination.total = res.total;
                } else {
                    this.commonService.handleResErr(res);
                }
            },
            error: (err) => {
                this.commonService.handleErr(err);
            }
        })
    }

    pageChanged(page: any) {
        this.pagination.page = page.page;
        this.getCallHistory();
    }

    searchCustomer() {
        this.customerService.customer.get({q: this.customerMobile}).pipe(
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
                        console.log('customer', this.customer);
                    }
                } else {
                    this.commonService.handleResErr(res);
                }
            },
        });
    }
}