import {Directive, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[listenScrollBottom]',
})
export class ScrollToBottomDirective {
  @Output() scrollToBottomEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    const {scrollTop, scrollHeight, clientHeight} = event.target;
    if (scrollTop > 0 && scrollHeight - scrollTop === clientHeight) {
      this.scrollToBottomEvent.next('scroll');
    }
  }
}
