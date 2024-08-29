// custom pipe
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'filterColorGlobal', standalone: true})
export class FilterColorGlobalPipe implements PipeTransform {
  statuses = [
    {label: 'New', value: 'new', bgColor: '#e53935', txtColor: '#17234e'},
    {
      label: 'Waiting',
      value: 'waiting',
      bgColor: '#fd35cf',
      txtColor: '#17234e',
    },
    {label: 'Doing', value: 'doing', bgColor: '#ff6700', txtColor: '#17234e'},
    {
      label: 'Completed',
      value: 'completed',
      bgColor: '#00a200',
      txtColor: '#17234e',
    },
    {label: 'Trash', value: 'trash', bgColor: '#252a31', txtColor: '#17234e'},
  ];
  constructor() {}
  transform(
    code: string,
    type: string = 'bgColor',
    defaultColor?: string,
  ): any {
    // console.log('code', code);
    if (defaultColor) {
      if (type === 'styleCellCalendar') {
        return {
          backgroundColor: `rgb(${this.hex2rgb(defaultColor).join(',')},0.4)`,
          borderColor: defaultColor,
          // borderColor: item.bgColor,
          color: '#17234e',
        };
      }
    }
    const item = this.statuses.find((s) => s.value === code);
    // console.log('item', item)
    if (item) {
      if (type === 'style') {
        return {
          backgroundColor: `rgb(${this.hex2rgb(item.bgColor || '').join(
            ',',
          )},0.2)`,
          color: item.bgColor,
        };
      }
      if (type === 'styleCellCalendar') {
        return {
          backgroundColor: `rgb(${this.hex2rgb(item.bgColor || '').join(
            ',',
          )},0.2)`,
          borderColor: item.bgColor,
          // borderColor: item.bgColor,
          color: item.txtColor,
        };
      }
      if (type === 'borderStyle') {
        return {
          border: `1px solid ${item.bgColor}`,
          color: item.bgColor,
        };
      }
      if (type === 'bgColor') {
        return item.bgColor;
      }
      if (type === 'label') {
        return item.label || code;
      }
    } else if (code === 'all') {
      if (type === 'bgColor') {
        return 'var(--bs-neutral)';
      }
    }
    if (type === 'label') {
      return code;
    }
    return {color: '#fff'};
  }
  hex2rgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // return {r, g, b} // return an object
    return [r, g, b];
  }
}
