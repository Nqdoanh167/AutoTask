import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getDataArray', standalone: true})
export class GetDataArrayPipe implements PipeTransform {
  transform(array: any[], key: string, valueKey: string): any {
    return array.filter((item) => {
      if (Array.isArray(item[key])) {
        return item[key].includes(valueKey);
      }
      return item[key] === valueKey;
    });
  }
}
