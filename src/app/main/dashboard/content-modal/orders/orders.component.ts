import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {
  Biz,
  Customer,
  CustomerTag,
  EntityPagination,
  Order,
} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CustomerService} from '@app/services/api/customer.service';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnDestroy, OnInit {
  @Input() orders!: Order[];
  @Input() loading!: boolean;
  public currentBiz!: Biz;
  public ordersCopy!: Order[];
  private destroy$ = new Subject();
  public sort = {
    amount: 0,
    createdAt: 0,
  };
  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz || '';
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orders']) {
      this.ordersCopy = this.orders;
    }
  }
  ngOnInit(): void {}

  changeSort(sort: 'amount' | 'createdAt') {
    switch (this.sort[sort]) {
      case 0:
        this.sort[sort] = 1;
        this.ordersCopy = this.orders.sort((a, b) => 
          sort === 'createdAt' 
            ? new Date(a[sort]).getTime() - new Date(b[sort]).getTime() 
            : Number(a[sort]) - Number(b[sort])
        );
        break;
      case 1:
        this.sort[sort] = -1;
        this.ordersCopy = this.orders.sort((a, b) => 
          sort === 'createdAt' 
            ? new Date(b[sort]).getTime() - new Date(a[sort]).getTime() 
            : Number(b[sort]) - Number(a[sort])
        );
        break;
      case -1:
        this.sort[sort] = 0;
        this.ordersCopy = [...this.orders];
        break;
      default:
        break;
    }
  }
  handleViewOrder(id: string) {
    let url = `${environment.urlDomain}/${this.currentBiz.alias}/sale-center/?code=${id}`;
    window.open(url, '_blank');
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
