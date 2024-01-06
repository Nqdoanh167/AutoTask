import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {IChangePage} from '@app/types/viewmodels';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'custom-change-page',
  templateUrl: './custom-change-page.component.html',
  styleUrls: ['./custom-change-page.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class CustomChangePageComponent implements OnInit {
  @Output() changePageEvent = new EventEmitter<IChangePage>();

  constructor() {}

  ngOnInit(): void {}

  changePage(value: IChangePage): void {
    this.changePageEvent.emit(value);
  }
}
