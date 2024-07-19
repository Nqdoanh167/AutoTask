import {Pipe, PipeTransform} from '@angular/core';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';

@Pipe({name: 'getDataArray', standalone: true})
export class GetDataArrayPipe implements PipeTransform {
  transform(
    array: any[],
    key: string,
    valueKey: string | string[],
    highPriorityKey?: string,
    highPriorityValue?: string | string[],
    uniqKey?: string,
  ): any {
    let result: any[] = [];
    if (highPriorityKey && highPriorityValue) {
      result = [...this.filterData(array, highPriorityKey, highPriorityValue)];
    }
    result = [...result, ...this.filterData(array, key, valueKey)];
    return uniqKey ? uniqBy(result, uniqKey) : uniq(result);
  }

  filterData(array: any[], key: string, valueKey: string | string[]) {
    if (Array.isArray(valueKey)) {
      return array.filter((item) => {
        if (Array.isArray(item[key])) {
          return item[key].some((value: string) => valueKey.includes(value));
        }
        return valueKey.includes(item[key]);
      });
    }

    return array.filter((item) => {
      if (Array.isArray(item[key])) {
        return item[key].includes(valueKey);
      }
      return item[key] === valueKey;
    });
  }
}
