import {PipeTransform, Pipe} from '@angular/core';
import moment from 'moment';

@Pipe({name: 'diffTime'})
export class DiffTimePipe implements PipeTransform {
  transform(subtrahend?: any, minuend?: any): string {
    if (!subtrahend) return '-';
    subtrahend = moment(subtrahend).toDate();
    minuend = moment(minuend).toDate();
    let diff = (minuend.getTime() - subtrahend.getTime()) / 1000;
    diff /= 60;

    let string = '';
    const minutes = Math.abs(Math.round(diff));

    // Calculate the number of minutes
    const remainingMinutes = minutes % 60;
    string = `${remainingMinutes}m`;

    // Calculate the number of hours
    const hours = Math.floor((minutes % 1440) / 60);
    string = hours ? `${hours}h, ${remainingMinutes}m` : string;

    // Calculate the number of days
    const days = Math.floor(minutes / 1440);
    string = days ? `${days}d, ${hours}h` : string;

    return string;
  }
}
