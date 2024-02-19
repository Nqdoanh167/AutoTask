import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'convertType',
})
export class ConvertTypePipe implements PipeTransform {
  transform(value: any, targetType: 'number' | 'string' | 'boolean'): any {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }
}
