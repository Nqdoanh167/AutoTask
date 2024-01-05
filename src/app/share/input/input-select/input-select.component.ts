import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-input-select',
  templateUrl: './input-select.component.html',
  styleUrls: ['./input-select.component.scss'],
})
export class InputSelectComponent implements OnInit {
  @ViewChild('spans') spans: any;
  @Input() inputType = 'input';
  @Input() maxlength: string = '';
  @Input() customClass: string = '';
  @Input() tags = '';
  @Input() listItemSelect: Array<any> = [];
  // @Input() itemValue: String = 'name';    // Phục vụ cho listItemSelect
  // @Input() itemKey: String = 'id';        // listItemSelect
  @Input() itemStyleCenter = true; // Căn giữa item
  @Input() enableRemove = true;
  @Input() defaultColor = 'var(--primary)';
  @Input() placeholder = '';
  @Input() tagEmpty = 'Thẻ tag rỗng';
  @Input() enableCreateText = true;
  @Input() showInputCreate = true;
  @Input() islistenOnPaste = false; // Lắng nghe sự kiện onPaste
  @Input() template: any;
  @Input() templateActive: any;
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onChange = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onPaste = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onRemove = new EventEmitter<any>();
  showSelectTag = false;
  constructor(private toastr: ToastrService) { }
  ngOnInit(): void { }

  onKeyDownTag({ event }: { event: any }) {
    const value = event.target.value.trim();
    if (value?.length) {
      setTimeout(() => {
        this.showSelectTag = false;
      }, 150);
    } else {
      this.showSelectTag = true;
    }
  }
  focusout({ event }: { event: any }) {
    this.onBlurInput({ event });
  }
  handleChooseTag(tag: any) {
    this.onChange.emit(tag);
  }
  onBlurInput({ event }: { event: any }) {
    this.onChange.emit(this.tags);
    setTimeout(() => {
      this.showSelectTag = false;
    }, 150);
  }
  onClickInput({ event }: { event: any }) {
    this.showSelectTag = true;
  }
  isSelect(item: any) {
    let result = false;
    const isSelect = this.tags === item;
    if (isSelect) { result = true; }
    return result;
  }

  onRemoveTag({ tag, index }: { tag: any, index: number }) {
    this.onRemove.emit({ tag, index });
  }
  // replaceTextTag(tag) {
  //   if (!this.listItemSelect.length) return tag
  //   const t = this.listItemSelect.find(t => t[this.itemKey.toString()] === tag)
  //   if (!t) return tag
  //   return t[this.itemValue.toString()]
  // }
  // getTagById(tag) {
  //   if (!this.listItemSelect.length) return tag
  //   const t = this.listItemSelect.find(t => t[this.itemKey.toString()] === tag)
  //   if (!t) return tag
  //   return t
  // }
  focusInputtag() {
    if (this.showInputCreate) { this.spans.nativeElement.focus(); }
  }
}
