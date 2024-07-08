import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'textTransform',
  standalone: true,
})
export class TextTransformPipe implements PipeTransform {
  transform(
    value: string,
    transformType: 'capitalize' | 'uppercase' | 'lowercase',
  ): string {
    if (!value) return '';

    switch (transformType) {
      case 'capitalize':
        return this.capitalize(value);
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      default:
        return value;
    }
  }

  private capitalize(value: string): string {
    const words = value.split(' ');

    const capitalizedWords = words.map((word) => {
      if (!word) return '';

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return capitalizedWords.join(' ');
  }
}
