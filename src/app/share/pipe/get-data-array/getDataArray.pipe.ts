import {Pipe, PipeTransform} from '@angular/core';
import find from 'lodash/find';

@Pipe({name: 'getDataArray'})
export class GetDataArrayPipe implements PipeTransform {
  transform(array: any, key: string, valueKey: string): any {
    return find(array, {[`${key}`]: valueKey});
  }
}
