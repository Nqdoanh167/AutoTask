export class CheckBoxTable<T> {
  public selectItems = new Map<string, T>();
  public fieldKey: string | keyof T = 'id';

  constructor(fieldKey: string = 'id') {
    this.fieldKey = fieldKey;
  }

  getRows() {
    return Array.from(this.selectItems.values());
  }

  getRowIds() {
    return Array.from(this.selectItems.keys());
  }

  getLengthRow() {
    return this.selectItems.size;
  }

  handleRefreshRow() {
    this.selectItems.clear();
  }

  handleSelectRow({
    rows,
    item,
    type = '',
    event,
  }: {
    rows: T[];
    item?: T;
    type?: string;
    event: Event;
  }) {
    const checked = (event.target as HTMLInputElement).checked;
    if (type === 'all') {
      if (checked) {
        rows.forEach((r) => {
          this.selectItems.set(r[this.fieldKey as keyof T] as string, r);
        });
      } else {
        rows.forEach((r) => {
          this.selectItems.delete(r[this.fieldKey as keyof T] as string);
        });
      }
    } else {
      if (!checked) {
        this.selectItems.delete(item![this.fieldKey as keyof T] as string);
      } else if (item) {
        this.selectItems.set(item![this.fieldKey as keyof T] as string, item);
      }
    }
  }

  isCheckRow(item: T): boolean {
    return this.selectItems.has(item[this.fieldKey as keyof T] as string);
  }

  isAllChecked(rows: T[]): boolean {
    if (!this.selectItems.size) return false;
    return rows.every((r) =>
      this.selectItems.has(r[this.fieldKey as keyof T] as string),
    );
  }

  filterSelectedRowsByIds(ids: string[]): T[] {
    return ids.map((id) => this.selectItems.get(id)!);
  }
}
