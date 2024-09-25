import {Component, OnDestroy, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {CallCustomerInfoComponent} from "@share/common/call-customer-info/call-customer-info.component";
import {BaseComponentsComponent} from "@share/common/base-components/base-components.component";
import {CustomerService} from "@app/services/api/customer.service";
import {takeUntil} from "rxjs/operators";
import {CommonService} from "@app/services/common/common.service";
import {Customer} from "@app/types/customer";

@Component({
    selector: 'app-common-modal-call-out',
    standalone: true,
    imports: [CommonModule, CallCustomerInfoComponent],
    templateUrl: './modal-call-out.component.html',
    styleUrls: ['../modal-call/modal-call.component.scss'],
})
export class ModalCallOutComponent extends BaseComponentsComponent implements OnInit, OnDestroy {
    showInfo = false;
    collapsed = false;
    muted = false;
    public customer: Customer | null = null;

    constructor(
        private readonly customerService: CustomerService,
        private readonly commonService: CommonService
    ) {
        super();
    }

    ngOnInit(): void {
        this.searchCustomer('0941399432');
    }

    changeMute() {
        this.muted = !this.muted;
    }

    resetState() {
        this.showInfo = false;
        this.collapsed = false;
        this.muted = false;
        this.customer = null;
    }

    changeCollapse() {
        this.collapsed = !this.collapsed;

        if (this.collapsed) {
            this.showInfo = false;
        }
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