import {OnDestroy, Pipe, PipeTransform} from '@angular/core';
import {ETaskChainType, ITaskChain} from '@app/types/flow';
import {calculateTime} from '@app/utils/common';
import moment from 'moment';

@Pipe({
  name: 'calculateTaskDeadline',
  standalone: true,
})
export class CalculateTaskDeadlinePipe implements PipeTransform, OnDestroy {
  public interval: any;
  transform(date: Date, taskChain: ITaskChain) {
    let data = {
      timeLeft: '',
      typeOverDeadline: 'notOver',
    };
    const calculate = () => {
      const subDate = calculateTime(date, new Date(), 'metrics') as {
        days?: number;
        hours?: number;
        minutes?: number;
      };
      const isCloseTask = taskChain?.status === ETaskChainType.CLOSED;
      if (subDate.days === 0 && subDate.hours === 0 && subDate.minutes === 0) {
        data.typeOverDeadline = 'now';
      } else if (moment().isAfter(date)) {
        data.typeOverDeadline = 'over';

        data.timeLeft = calculateTime(
          isCloseTask ? taskChain.updatedAt : new Date(),
          date,
        ) as string;
      }
      if (data.typeOverDeadline !== 'over') {
        data.timeLeft = calculateTime(
          date,
          isCloseTask ? taskChain.updatedAt : new Date(),
        ) as string;
      }
    };
    calculate();
    this.interval = setInterval(() => {
      calculate();
    }, 3000);

    return data;
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
