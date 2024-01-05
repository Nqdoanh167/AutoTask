import { formatDate } from 'src/app/utils/formatDate';
import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'timeView' })
export class TimeViewPipe implements PipeTransform {
  transform(time: string | Date | null | undefined): string {
    if (formatDate(time, 'dd/MM/yyyy') === formatDate(new Date(), 'dd/MM/yyyy')) {
      return formatDate(time, 'h:mm');
    }
    if (formatDate(time, 'MM/yyyy') === formatDate(new Date(), 'MM/yyyy')) {
      return formatDate(time, 'h:mm dd/MM');
    }
    return formatDate(time, 'h:mm dd/MM/yyyy');
  }
}
