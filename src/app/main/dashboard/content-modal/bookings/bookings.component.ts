import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {Biz, Order} from '@app/types/viewmodels';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent implements OnDestroy, OnInit, OnChanges {
  @Input() bookings!: any[];
  @Input() loading!: boolean;
  public currentBiz!: Biz;
  public bookingsCopy!: any[];
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
    if (changes['bookings']) {
      this.bookingsCopy = this.bookings;
    }
  }

  ngOnInit(): void {}

  changeSort(sort: 'amount' | 'createdAt') {
    switch (this.sort[sort]) {
      case 0:
        this.sort[sort] = 1;
        this.bookingsCopy = this.bookings.sort((a, b) =>
          sort === 'createdAt'
            ? new Date(a[sort]).getTime() - new Date(b[sort]).getTime()
            : Number(a[sort]) - Number(b[sort]),
        );
        break;
      case 1:
        this.sort[sort] = -1;
        this.bookingsCopy = this.bookings.sort((a, b) =>
          sort === 'createdAt'
            ? new Date(b[sort]).getTime() - new Date(a[sort]).getTime()
            : Number(b[sort]) - Number(a[sort]),
        );
        break;
      case -1:
        this.sort[sort] = 0;
        this.bookingsCopy = [...this.bookings];
        break;
      default:
        break;
    }
  }

  handleViewBooking(id: string) {
    let url = `${environment.urlDomain}/${this.currentBiz.alias}/booking/booking-list?id=${id}`;
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
