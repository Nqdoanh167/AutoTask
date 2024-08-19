import {PipeTransform, Pipe} from '@angular/core';
import moment from 'moment';

@Pipe({name: 'formatSeconds'})
export class FormatSecondsPipe implements PipeTransform {
  transform(seconds: number | null): string {
    if (seconds === null) {
      return '';
    }
    let string = '';
    // Calculate the number of seconds
    const sec = seconds % 60;
    // Calculate the number of minutes
    const min = Math.floor(seconds / 60) % 60;
    // Calculate the number of hours
    const hour = Math.floor(seconds / 3600);
    // Format the time string
    if (hour > 0) {
      string += hour + ':';
    }
    if (min < 10) {
      string += '0';
    }
    string += min + ':';
    if (sec < 10) {
      string += '0';
    }
    string += sec;

    return string;
  }
}
