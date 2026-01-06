import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {filterItems} from '@app/utils/common';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import {Subject, takeUntil} from 'rxjs';
import {
  EntityPagination,
  OrderPlatformSource,
  Source,
} from 'src/app/types/viewmodels';

interface TypeSource {
  id: string;
  name: string;
  platformId: string;
  link?: string;
  platform: string;
  picture: string;
  count: number;
  isHover: boolean;
  rows: Source[];
}

@Component({
  selector: 'app-order-create-source',
  templateUrl: './task-create-source.component.html',
  styleUrls: ['./task-create-source.component.scss'],
  standalone: true,
  imports: [CommonModule, TooltipModule],
})
export class TaskCreateSourceComponent implements OnInit, OnDestroy {
  @ViewChild('inputSearch') inputSearch!: any;

  @Input() values: OrderPlatformSource[] = [];
  @Input() readonly: boolean = false;
  @Input() valueIds: string[] = [];
  @Input() enableSearch = true;
  @Output() changePlatformSource = new EventEmitter<OrderPlatformSource[]>();
  @Output() changeDefaultData = new EventEmitter<Object>();

  destroy = new Subject();
  isHover = false;

  listTypeSource: TypeSource[] = [
    {
      name: 'Facebook',
      id: 'FACEBOOK',
      platformId: 'FACEBOOK',
      platform: 'FACEBOOK',
      picture: './assets/images/platform_facebook.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      name: 'Shopee',
      id: 'SHOPEE',
      platformId: 'SHOPEE',
      platform: 'SHOPEE',
      picture: './assets/images/platform_shopee.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      id: 'TIKTOK',
      name: 'Tiktok',
      platformId: 'TIKTOK',
      platform: 'TIKTOK',
      picture: './assets/images/platform_tiktok.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      name: 'Ladipage',
      id: 'LADIPAGE',
      platformId: 'LADIPAGE',
      platform: 'LADIPAGE',
      picture: './assets/images/platform_ladipage.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      name: 'Tiki',
      id: 'TIKI',
      platformId: 'TIKI',
      platform: 'TIKI',
      picture: './assets/images/platform_tiki.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      name: 'Zalo',
      id: 'ZALO',
      platformId: 'ZALO',
      platform: 'ZALO',
      picture: './assets/images/platform_zalo.png',
      count: 0,
      isHover: false,
      rows: [],
    },
    {
      id: 'OTHER',
      name: 'OTHER',
      platformId: 'OTHER',
      platform: 'OTHER',
      picture: '',
      count: 0,
      isHover: false,
      rows: [],
    },
  ];
  listTypeSourceId: string[] = this.listTypeSource.map((i) =>
    i.id.toUpperCase(),
  );
  _filteredItems: any[] = [];
  search: any = {
    timeout: null,
    debounce: 300,
    isActive: false,
  };

  source: EntityPagination<Source> = {
    rows: [],
    loading: false,
    isGet: false,
  };
  @HostListener('document:click', ['$event'])
  onClick(ev: MouseEvent) {
    const clickInside = this.elemRef.nativeElement.contains(ev.target);
    if (!clickInside) {
      this.isHover = false;
    }
  }

  constructor(
    private autoTaskService: AutoTaskService,
    private elemRef: ElementRef,
  ) {}

  ngOnInit(): void {
    // source
    this.autoTaskService.listSourceObservable
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: (res) => {
          if (res) {
            this.source.rows = res;
            this.setupItems();
            this.source.isGet = true;
          }
        },
      });

    // this.valueIds = this.values.map(v => v.id);
  }
  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
  setupItems() {
    this.listTypeSource = this.listTypeSource.map((item) => {
      item.rows = this.source.rows.filter((i) => i.platform === item.id);
      item.count = item.rows.length;
      return item;
    });
  }
  show() {
    console.log('show');
    if (this.readonly) return;
    this.isHover = !this.isHover;
    this.enableSearch = this.source.rows.length > 5;

    this._filteredItems = [...this.listTypeSource];

    if (this.enableSearch) {
      setTimeout(() => {
        this.inputSearch?.nativeElement?.focus();
        this.inputSearch.nativeElement.value = '';
      }, 200);
    }
  }
  mouseover(item?: TypeSource) {
    if (item) {
      this._filteredItems = this._filteredItems.map((e) => {
        e.isHover = false;
        if (e.id === item.id) {
          e.isHover = true;
        }
        return e;
      });
    }
    // this.isHover = true;
  }

  onChangeInputSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.search.timeout);
    if (value) {
      this.search.isActive = true;
      this.search.timeout = setTimeout(() => {
        if (this.listTypeSourceId.includes(value.toUpperCase())) {
          this._filteredItems = this.listTypeSource.filter(
            (i) => i.id.toUpperCase() === value.toUpperCase(),
          );
          return;
        }

        const rows: any = [];
        this.listTypeSource.forEach((item) => {
          rows.push({...item});
          item.rows.forEach((i) => {
            rows.push({...i, rows: []});
          });
        });
        // this._filteredItems = new SearchHelper(['name', 'platformId']).filter(rows, value);
        this._filteredItems = filterItems(rows, ['name', 'platformId'], value);
      }, this.search.debounce);
    } else {
      this._filteredItems = [...this.listTypeSource];
      this.search.isActive = false;
    }
  }
  // typeSource: Nguồn cha
  // source: Nguồn con
  onSelect(event: Event, typeSource: TypeSource, source?: any) {
    // event.preventDefault();
    // event.stopPropagation();
    // console.log('------------');
    // console.log('typeSource', typeSource);
    // console.log('source', source);
    // Có phần tử con thì k cho phép select cha.
    if (!source && typeSource.rows.length) return;
    // Trường hợp đang search mà chọn nguồn thì kiểm tra xem có nguồn cha ko thì detect lại để tự độgn chọn nguồn cha
    if (
      !source &&
      this.search.isActive &&
      this.listTypeSourceId.includes(typeSource.platform)
    ) {
      const hasSourceMain = this.listTypeSource.find(
        (i) => i.id === typeSource.platform,
      );
      if (hasSourceMain) {
        source = {...typeSource};
        typeSource = {...hasSourceMain};
      }
    }
    // console.log('typeSource', typeSource);
    // console.log('source', source);
    if (source) {
      const removeIds = typeSource.rows.map((r) => r.id);
      removeIds.push(typeSource.id);
      // console.log('removeIds', removeIds)

      const hasSource = this.valueIds.includes(source.id);

      // Bỏ các select cùng loại nguồn
      this.valueIds = this.valueIds.filter((v) => !removeIds.includes(v));
      if (!hasSource) {
        this.valueIds.push(source.id);
        this.valueIds.push(typeSource.id);
      }
    } else {
      if (this.valueIds.includes(typeSource.id)) {
        this.valueIds = this.valueIds.filter((v) => v !== typeSource.id);
      } else {
        this.valueIds.push(typeSource.id);
      }
    }

    // this.values = [...this.listTypeSource, ...this.source.rows]
    //   .filter((v) => this.valueIds.includes(v.id))
    //   .map((v) => ({
    //     id: v.id,
    //     name: v.name,
    //     link: v.link,
    //     picture: v.picture,
    //     platform: v.platform,
    //     platformId: v.platformId,
    //   }));
    this.values = this.valueIds.map((v)=>{
      const source = [...this.listTypeSource, ...this.source.rows].find((i) => i.id === v);
      if (source) {
        return {
          id: source.id,
          name: source.name,
          link: source.link,
          picture: source.picture,
          platform: source.platform,
          platformId: source.platformId,
        };
      }
      return null
    }).filter((i) => i !== null) as OrderPlatformSource[];

    this.changePlatformSource.emit(this.values);
    this.changeDefaultData.emit({
      platformSources: this.values,
      platformSourceIds: this.values.map((i) => i.id),
    });
    // console.log('hover', this.isHover);
    setTimeout(() => {
      this.isHover = false;
    }, 0);
  }
}
