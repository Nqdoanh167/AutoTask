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
    mobile = '';
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

    constructor(
        private readonly customerService: CustomerService,
        private readonly callService: SmsOttCallService,
        private readonly commonService: CommonService
    ) {
        super();
    }

    ngOnInit(): void {
        this.getCallHistory();
    }

    addNum(num: string) {
        this.mobile += num;
    }

    onCall() {

    }

    onSelectHistory(history: any) {
        this.showInfo = true;
        this.searchCustomer('0941399432');
    }

    getCallHistory() {
        const conditions = {
            page: this.pagination.page,
            limit: this.pagination.limit
        };
        this.callService.history.get(conditions).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (res) => {
                if (res && res.status === 200) {
                    this.histories = res.data;
                    this.pagination.total = res.total;
                    console.log('histories', this.histories);
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
        console.log('page', page);
        this.pagination.page = page.page;
        this.getCallHistory();
    }

    searchCustomer(mobile: string) {
        this.customerService.customer.get({q: mobile}).pipe(
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