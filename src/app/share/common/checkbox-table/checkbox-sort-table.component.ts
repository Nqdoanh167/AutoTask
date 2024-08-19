import {Component} from '@angular/core';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {CheckBoxTable} from '@app/utils/checkBoxTable';

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
  protected fieldKey: string | keyof T = 'id';

  public checkRow: CheckBoxTable<T> = new CheckBoxTable();
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

  handleRefreshRow() {
    this.checkRow.handleRefreshRow();
  }

  handleSelectRow({
    item,
    type = '',
    event,
  }: {
    item?: T;
    type?: string;
    event: Event | any;
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
    this.checkRow.filterSelectedRowsByIds(ids);
  }
  // end send rows
}
