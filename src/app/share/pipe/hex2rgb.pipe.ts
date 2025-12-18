import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'hex2rgb', standalone: true})
export class Hex2RgbPipe implements PipeTransform {
  transform(hex: string | undefined): string {
    if (!hex || !hex.startsWith('#')) {
      return 'rgb(0, 0, 0)';
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b}, 0.2)`;
  }
}
