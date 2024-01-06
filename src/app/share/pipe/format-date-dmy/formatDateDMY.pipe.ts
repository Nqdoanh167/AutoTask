import {PipeTransform, Pipe} from '@angular/core';

@Pipe({name: 'formatDateDMY'})
export class FormatDateDMYPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return '-';
    const datePart = value?.match(/\d+/g),
      year = datePart?.[0],
      month = datePart?.[1],
      day = datePart?.[2];

    return day + '/' + month + '/' + year;
  }
}
