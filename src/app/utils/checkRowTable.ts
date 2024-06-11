export class CheckRowTable<T> {
  selectItems: T[] = [];
  selectItemIds: string[] = [];
  fieldKey: string | keyof T = 'id';
  constructor(fieldKey: string = 'id') {
    this.fieldKey = fieldKey;
  }
  getRows() {
    return this.selectItems;
  }
  getRowIds() {
    return this.selectItemIds;
  }
  getLengthRow() {
    return this.selectItemIds.length;
  }

  handleRefreshRow() {
    this.selectItemIds = [];
    this.selectItems = [];
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
      const rowIds = rows.map((r) => r[this.fieldKey as keyof T]);
      this.selectItems = this.selectItems.filter(
        (s) => !rowIds.includes(s[this.fieldKey as keyof T]),
      );
      if (checked) {
        this.selectItems.push(...rows);
      }
    } else {
      if (!checked) {
        this.selectItems = this.selectItems.filter(
          (s) =>
            s?.[this.fieldKey as keyof T] !== item?.[this.fieldKey as keyof T],
        );
      } else {
        this.selectItems.push(item!);
      }
    }
    this.selectItemIds = this.selectItems.map(
      (s) => s?.[this.fieldKey as keyof T],
    ) as string[];
  }

  isCheckRow(item: T): boolean {
    return this.selectItemIds.includes(
      item[this.fieldKey as keyof T] as string,
    );
  }
  isAllChecked(rows: T[]): boolean {
    if (!this.selectItemIds.length) return false;
    return (
      this.selectItemIds.length >= rows.length &&
      rows.every((r) =>
        this.selectItemIds.includes(r[this.fieldKey as keyof T] as string),
      )
    );
  }
}
