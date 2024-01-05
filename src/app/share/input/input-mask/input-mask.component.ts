import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Biz } from 'src/app/types/viewmodels';
import { AuthService } from 'src/app/services/api/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-input-mask',
  templateUrl: './input-mask.component.html',
  styleUrls: ['./input-mask.component.scss']
})
export class InputMaskComponent implements OnInit, OnChanges {
  @Input() id: string | null = null;
  @Input() className: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() value: number = 0;
  @Input() align: 'left' | 'right' = 'left';
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() isQuantity: boolean = false;
  @Input() allowNegativeNumbers = false;
  @Input() max: number | null = null;
  @Input() min: number | null = null;
  @Input() defaultOption = {};
  option = {
    mask: 'separator.2',
    symbol: "₫",
    thousandSeparator: ","
  };
  @Output() changeValue = new EventEmitter<number>();
  @Output() paste = new EventEmitter<Event>();
  biz!: Biz;
  destroy = new Subject();
  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    this.cdr.detectChanges();

    if (changes['isQuantity']) {
      setTimeout(() => {
        this.setupOption(this.biz);
      }, 0);
    }
  }

  ngOnInit(): void {

    if (!isNaN(Number(String(this.max)))) {
      this.max = Number(String(this.max))
    }
    if (!isNaN(Number(String(this.min)))) {
      this.min = Number(String(this.min))
    }

    if (!this.value) this.value = 0;
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: res => {
        if (res) {
          this.biz = res;

          this.setupOption(this.biz);
        }
      }
    })
  }
  setupOption(biz: Biz) {
    if (!biz) return;
    this.option = {
      mask: biz.currency.mask,
      symbol: biz.currency.symbol,
      thousandSeparator: biz.currency.thousandSeparator,
    }
    if (this.isQuantity) {
      this.option.mask = 'separator.0';
      this.option.symbol = '';
      Object.assign(this.option, this.defaultOption);
      setTimeout(() => {
        this.onKeyup();
      }, 0)
    }

  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
  onPaste(event: Event) {
    this.paste.emit(event);
  }
  onKeyup(isEmit = false) {
    if (typeof this.max === 'number' && this.value > this.max) {
      this.value = this.max;
      if (isEmit) {
        this.changeValue.emit(this.max);
      } else {
      }
    }
    if (typeof this.min === 'number' && this.value < this.min) {
      this.value = this.min;
      if (isEmit) {
        this.changeValue.emit(this.value);
      }
    }

  }
  onChange() {
    if (!this.value) this.value = 0;
    this.changeValue.emit(this.value);
  }

}
