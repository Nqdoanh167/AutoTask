import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'sortBy',
  standalone: true,
})
export class SortByPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) {
      return array;
    }

    return [...array].sort((a, b) => {
      const aValue = a[field] !== undefined ? a[field] : 0;
      const bValue = b[field] !== undefined ? b[field] : 0;
      return aValue - bValue;
    });
  }
}
