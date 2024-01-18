import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {Subject} from 'rxjs';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TextAreaComponent,
    },
  ],
})
export class TextAreaComponent
  implements OnInit, ControlValueAccessor, OnChanges
{
  @Input() minHeight: number = 20;
  @Input() maxHeight: number = 150;
  @Input() readonly: boolean = false;
  @Input() placeholder: string = '';
  @Input() inputClass: string = '';
  @Input() inline: string = '';
  @Input() require: Boolean = false;
  @Input() emoj: Boolean = true;
  @Input() value: string = '';
  @Input() maxLength: number = 10000;
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() keyupSpace: EventEmitter<KeyboardEvent> = new EventEmitter();
  @Output() keydownEnter: EventEmitter<KeyboardEvent> = new EventEmitter();
  @Output() onPaste: EventEmitter<ClipboardEvent> = new EventEmitter();
  // for FormControl
  onChange = (value: string) => {};
  touched: boolean = false;
  disabled: boolean = false;
  onTouched: (() => {}) | undefined;
  // End: for FormControl

  @ViewChild('textArea') textAreaElm: ElementRef | undefined = undefined;
  @ViewChild('mask') maskElm: ElementRef | undefined = undefined;
  destroy = new Subject();
  constructor() {}
  // for FormControl
  writeValue(value: string) {
    this.value = value;
    setTimeout(() => {
      this.resizeTextArea();
    }, 100);
  }
  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }
  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }
  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  ngOnInit() {
    this.resizeTextArea();
  }
  ngOnChanges(changes: SimpleChanges): void {
    setTimeout(() => {
      this.resizeTextArea();
    }, 100);
  }
  ngOnDestroy() {
    this.destroy.next(true);
    this.destroy.complete();
  }
  onPasteEvent(event: ClipboardEvent) {
    this.onPaste.emit(event);
  }
  onInputKeyUp(event: any) {
    if (event.code === 'Space') {
      this.keyupSpace.emit(event);
    }
  }
  onKeyDownEnter(event: any) {
    this.keydownEnter.emit(event);
  }
  insert(content: string) {
    document.execCommand('insertText', false /*no UI*/, content);
    this.onChangeValue();
  }
  focus() {
    this.textAreaElm?.nativeElement.focus();
  }
  onChangeValue() {
    this.resizeTextArea();
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }
  resizeTextArea() {
    if (this.textAreaElm) {
      const minHeight = this.minHeight - 20;
      this.textAreaElm.nativeElement.style.height = minHeight + 'px';
      let height = this.textAreaElm.nativeElement.scrollHeight;
      if (height < minHeight) {
        height = minHeight;
      }
      this.textAreaElm.nativeElement.style.height = height - 6 + 'px';
    } else {
      setTimeout(() => {
        this.resizeTextArea();
      }, 100);
    }
  }
}
