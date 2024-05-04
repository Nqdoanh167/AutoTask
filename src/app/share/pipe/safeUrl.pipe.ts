import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({name: 'safe'})
export class SafePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}
  transform(text: string, type = 'url') {
    if (type === 'url')
      return this.domSanitizer.bypassSecurityTrustResourceUrl(text);
    if (type === 'html') return this.domSanitizer.bypassSecurityTrustHtml(text);
    return text;
  }
}
