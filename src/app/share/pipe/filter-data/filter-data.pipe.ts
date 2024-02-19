import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterData',
})
export class FilterDataPipe implements PipeTransform {
  constructor() {}
  transform(items?: any[], keywords?: any[], properties?: string[]): any[] {
    if (!items) return [];
    if (!keywords?.length) return items;
    if (!properties?.length) return items;
    return items.filter((item) => {
      let itemFound: Boolean = false;
      for (let i = 0; i < properties.length; i++) {
        const modifiedValue = this.removeAccents(
          item[properties[i]].toLowerCase(),
        );
        const modifiedKeywords = keywords?.map((keyword) =>
          this.removeAccents(keyword.toLowerCase()),
        );
        if (!modifiedKeywords?.includes(modifiedValue)) {
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
