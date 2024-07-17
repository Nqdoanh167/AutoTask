import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getDataArray', standalone: true})
export class GetDataArrayPipe implements PipeTransform {
  transform(array: any[], key: string, valueKey: string | string[]): any {
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
