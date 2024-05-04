import {PipeTransform, Pipe} from '@angular/core';

@Pipe({name: 'calculateDivision'})
export class CalculateDivisionPipe implements PipeTransform {
  transform(dividend: number = 0, divisor?: number): number {
    if (!divisor) return 0;
    return Number((dividend / divisor).toFixed(2));
  }
}
