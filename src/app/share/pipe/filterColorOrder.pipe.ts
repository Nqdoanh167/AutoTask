// custom pipe
import { PipeTransform, Pipe, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MainService } from 'src/app/services/api/main.service'
import { Status } from 'src/app/types/viewmodels';

@Pipe({ name: 'filterColorOrder' })
export class FilterColorOrderPipe implements PipeTransform, OnDestroy {
  destroy = new Subject();
  statuses: Status[] = [];
  constructor(private mainService: MainService) {
    // statuses
    this.mainService.listStatus.pipe(takeUntil(this.destroy)).subscribe({
      next: res => {
        console.log('res', res);
        if (res?.length) {
          this.statuses = res;
        }
      }
    })
  }
  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.destroy.next(true);
    this.destroy.complete();
  }
  transform(code: string, type: string = 'background'): any {
    const item = this.statuses.find(s => s.code === code);
    if (item) {
      if (type === 'style') {
        return { backgroundColor: item.bgColor, color: item.txtColor };
      }
      if (type === 'bgColor') {
        return item.bgColor;
      }
      if (type === 'txtColor') {
        return item.txtColor || '#fff';
      }
      if (type === 'name') {
        return item.name || code;
      }
    }
    return { color: '#fff' };
  }
}
