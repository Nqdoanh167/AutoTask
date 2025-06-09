import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterData',
})
export class FilterDataPipe implements PipeTransform {
  constructor() {}
  transform(items?: any[], keywords?: any[] | (() => any[]), properties?: string[]): any[] {
    if (!items) return [];
    if (!properties?.length) return items;

    let excludeValues: any[] = [];
    if (typeof keywords === 'function') {
      excludeValues = keywords();
    } else if (Array.isArray(keywords)) {
      excludeValues = keywords;
    }
    
    if (!excludeValues?.length) return items;

    return items.filter((item) => {
      let itemFound: Boolean = false;
      for (let i = 0; i < properties.length; i++) {
        const modifiedValue = this.removeAccents(
          item[properties[i]].toLowerCase(),
        );
        const modifiedKeywords = excludeValues?.map((keyword) =>
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
