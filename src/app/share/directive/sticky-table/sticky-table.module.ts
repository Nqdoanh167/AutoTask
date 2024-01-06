import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgModule,
  Optional,
} from '@angular/core';

@Directive({
  selector: '[stickyTable]',
})
export class StickyTableDirective {
  constructor(private el: ElementRef) {}

  get x() {
    return (this.el.nativeElement as HTMLElement)?.getBoundingClientRect()?.x;
  }
}

@Directive({
  selector: '[sticky]',
})
export class StickyDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    @Optional() private table: StickyTableDirective,
  ) {}

  ngAfterViewInit() {
    const el = this.el.nativeElement as HTMLElement;
    const {x} = el.getBoundingClientRect();
    el.style.position = 'sticky';
    el.style.left = this.table ? `${x - this.table.x}px` : '0px';
  }
}

@NgModule({
  declarations: [StickyDirective, StickyTableDirective],
  imports: [CommonModule],
  exports: [StickyDirective, StickyTableDirective],
})
export class StickyDirectiveModule {}
