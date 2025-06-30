import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inArrayFilter',
  standalone: true,
})
export class InArrayFilterPipe implements PipeTransform {
  transform(items: any[], field: string, values: any[]): any[] {
    const valuesData = Array.from(new Set(values)).filter(Boolean); 
    if (!items || !field || !valuesData.length) return items;
    return items.filter((item) => valuesData.includes(item[field]));
  }
}