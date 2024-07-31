import {Directive, Input, TemplateRef, ViewContainerRef} from '@angular/core';

interface ILetContext<T> {
  ngLet: T;
}

@Directive({
  selector: '[ngLet]',
  standalone: true,
})
export class LetDirective<T> {
  public context: ILetContext<T | undefined> = {ngLet: undefined};

  constructor(
    viewContainer: ViewContainerRef,
    templateRef: TemplateRef<ILetContext<T>>,
  ) {
    viewContainer.createEmbeddedView(templateRef, this.context);
  }

  @Input()
  public set ngLet(value: T) {
    this.context.ngLet = value;
  }
}
