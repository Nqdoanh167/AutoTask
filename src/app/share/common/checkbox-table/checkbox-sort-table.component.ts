import {Component, ViewChild} from '@angular/core';
import {CheckRowTable} from '@app/utils/checkRowTable';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {NgSelectComponent} from '@ng-select/ng-select';

@Component({
  selector: 'app-checkbox-table',
  standalone: true,
  imports: [],
  template: '',
})
export class CheckboxSortTableComponent<
  T,
  K extends any,
> extends StandardTableComponent<T, K> {
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;

  protected fieldKey: string | keyof T = 'id';
  protected batchAction = null;

  public checkRow: CheckRowTable<T> = new CheckRowTable();
  public isShift = false;
  public lastChecked: number = 0;

  constructor() {
    super();
  }

  // select rows
  getCheckRows() {
    return this.checkRow.getRows();
  }
  getRowIds() {
    return this.checkRow.getRowIds();
  }
  getLengthCheckRow() {
    return this.checkRow.getLengthRow();
  }
  getCheckRowOrItems() {
    return this.checkRow.getLengthRow()
      ? this.checkRow.getRows()
      : this.item.rows;
  }
  handleSelectRow({
    item,
    type = '',
    event,
  }: {
    item?: T;
    type?: string;
    event: Event | any;
    rows?: T[];
  }) {
    const isChecked = event.target.checked;
    let indexCurrent: number = this.item.rows.findIndex(
      (el) =>
        el?.[this.fieldKey as keyof T] === item?.[this.fieldKey as keyof T],
    );
    if (this.isShift && isChecked) {
      const indexLastChecked = this.lastChecked;
      const start = Math.min(indexLastChecked, indexCurrent);
      const end = Math.max(indexLastChecked, indexCurrent);
      this.item.rows.forEach((el, index) => {
        if (index > start && index <= end) {
          this.checkRow.handleSelectRow({
            rows: this.item.rows,
            item: el,
            type,
            event,
          });
        }
      });
      return;
    }
    this.lastChecked = indexCurrent;
    this.checkRow.handleSelectRow({rows: this.item.rows, item, type, event});
  }

  isCheckRow(item: T): boolean {
    return this.checkRow.isCheckRow(item);
  }
  isAllChecked(): boolean {
    return this.checkRow.isAllChecked(this.item.rows);
  }
  filterSelectedRowsByIds(ids: string[]) {
    this.checkRow.selectItems = this.checkRow.selectItems.filter(
      (s: T | any) => {
        return s?.['id'] && !ids.includes(s['id']);
      },
    );
    this.checkRow.selectItemIds = this.checkRow.selectItemIds.filter(
      (el) => !ids.includes(el),
    );
  }
  // end send rows
}
