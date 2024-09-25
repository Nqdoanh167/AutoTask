import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {AsyncPipe, CommonModule} from "@angular/common";
import {BaseComponentsComponent} from "@share/common/base-components/base-components.component";
import {CustomModalComponent} from "@share/custom/custom-modal/custom-modal.component";
import {Customer} from "@app/types/customer";
import {environment} from "../../../../environments/environment";

@Component({
    selector: 'app-common-call-customer-info',
    standalone: true,
    imports: [CommonModule, CustomModalComponent],
    templateUrl: './call-customer-info.component.html',
    styleUrls: ['./call-customer-info.component.scss'],
})
export class CallCustomerInfoComponent extends BaseComponentsComponent implements OnInit, OnDestroy {
    @Output('onClose') onClose = new EventEmitter<any>();
    @Input('customer') customer: Customer | null = null;

    ngOnInit(): void {
    }

    close() {
        this.onClose.emit();
    }

    viewOrder(code?: string) {
        let url = `${environment.urlDomain}/${this.bizAlias}/sale-center/?code=${code}`;
        window.open(url, '_blank');
    }

    viewCustomer() {
        let url = `${environment.urlDomain}/${this.bizAlias}/customers/${this.customer?.id}`;
        window.open(url, '_blank');
    }
}