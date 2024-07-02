import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getDataArray'})
export class GetDataArrayPipe implements PipeTransform {
  transform(array: any[], key: string, valueKey: string): any {
    console.log({
      array,
      key,
      valueKey,
    });
    return array.filter((item) => {
      if (Array.isArray(item[key])) {
        return item[key].includes(valueKey);
      }
      return item[key] === valueKey;
    });
  }
}
