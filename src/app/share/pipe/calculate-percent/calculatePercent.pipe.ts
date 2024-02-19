import {PipeTransform, Pipe} from '@angular/core';

@Pipe({name: 'calculatePercent'})
export class CalculatePercentPipe implements PipeTransform {
  transform(value?: number, total?: number): number | string {
    if (!value || !total) return 0;
    if (value >= 0 && total === 0) return 'Không xác định';
    return Number(((value / total) * 100).toFixed(2));
  }
}
