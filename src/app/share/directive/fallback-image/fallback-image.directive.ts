import {Directive, HostBinding, HostListener, Input} from '@angular/core';

@Directive({
  selector: 'img[fallback]',
})
export class FallbackImageDirective {
  @Input()
  @HostBinding('src')
  src?: string;

  @Input() fallback: string = 'assets/images/no-photo.jpeg';

  @HostListener('error')
  onError() {
    this.src = this.fallback;
  }
}
