import {Pipe, PipeTransform} from '@angular/core';
import moment from 'moment';
import {TranslocoService} from '@ngneat/transloco';

@Pipe({name: 'diffTimeTranslate'})
export class DiffTimeTranslatePipe implements PipeTransform {
  constructor(private readonly translocoService: TranslocoService) {}

  translationSelect(key: string) {
    return this.translocoService.translate('common.dateTime.' + key);
  }

  transform(
    subtrahend?: any,
    minuend: any = undefined,
    type: 'ago' | 'after' = 'ago',
  ): string {
    if (!subtrahend) return '-';
    subtrahend = moment(subtrahend).toDate();
    minuend = moment(minuend).toDate();
    let diff = (minuend.getTime() - subtrahend.getTime()) / 1000;
    diff /= 60;

    let string = '';
    const minutes = Math.abs(Math.round(diff));

    // Calculate the number of minutes
    const remainingMinutes = minutes % 60;
    string = `${remainingMinutes} ${this.translationSelect('minute')}`;

    // Calculate the number of hours
    const hours = Math.floor((minutes % 1440) / 60);
    string = hours
      ? `${hours} ${this.translationSelect(
          'hour',
        )}, ${remainingMinutes} ${this.translationSelect('minute')}`
      : string;

    // Calculate the number of days
    const days = Math.floor(minutes / 1440);
    string = days
      ? `${days} ${this.translationSelect(
          'day',
        )}, ${hours} ${this.translationSelect('hour')}`
      : string;

    return `${string} ${this.translationSelect(type)}`;
  }
}
