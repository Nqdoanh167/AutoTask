import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'searchFilter',
  standalone: true,
})
export class SearchFilterPipe implements PipeTransform {
  transform(items: any[], keyword: any, properties: string[]): any[] {
    if (!items) return [];
    if (!keyword) return items;
    return items.filter((item) => {
      let itemFound: Boolean = false;
      for (let i = 0; i < properties.length; i++) {
        if (
          this.removeAccents(item[properties[i]].toLowerCase()).indexOf(
            this.removeAccents(keyword.toLowerCase()),
          ) !== -1
        ) {
          itemFound = true;
          break;
        }
      }
      return itemFound;
    });
  }

  removeAccents(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
