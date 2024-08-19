import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'mycurrency', standalone: true})
export class MycurrencyPipe implements PipeTransform {
  option = {
    mask: 'separator.2',
    symbol: '₫',
    thousandSeparator: ',',
  };

  transform(value: number): string | null {
    return value !== null && value !== undefined
      ? value.toLocaleString('it-IT', {
          style: 'currency',
          currency: 'VND',
        })
      : null;
  }
}
