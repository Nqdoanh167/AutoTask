import {Pipe, PipeTransform} from '@angular/core';
import {calculateTime} from '@app/utils/common';

@Pipe({
  name: 'calculateDeadline',
  standalone: true,
})
export class CalculateDeadlinePipe implements PipeTransform {
  transform(fromDate: Date, toDate: Date): unknown {
    return calculateTime(fromDate, toDate);
  }
}
