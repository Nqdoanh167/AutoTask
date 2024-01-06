import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {debounceTime, Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-multi-lazy-select',
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule],
  templateUrl: './multi-lazy-select.component.html',
  styleUrls: ['./multi-lazy-select.component.scss'],
})
export class MultiLazySelectComponent implements OnInit {
  @Input() touched: boolean = false;
  @Input() placeholder: string = 'Search';
  @Input() loading: boolean = false;
  @Input() items: any[] = [];
  @Input() value?: any;
  @Input() bindLabel?: string = 'name';
  @Input() bindValue?: string = 'id';

  protected input$ = new Subject<string>();
  constructor() {}

  ngOnInit(): void {
    this.onSearch();
  }

  handleChangeValue() {}

  onLoadMore() {}

  onSearch() {
    this.input$
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((data) => {
        console.log('data =>', data);
      });
  }
}
