import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {iif, Subject, takeUntil} from 'rxjs';
import {MainService} from 'src/app/services/api/main.service';
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
  templateUrl: './order-create-source.component.html',
  styleUrls: ['./order-create-source.component.scss'],
})
export class OrderCreateSourceComponent implements OnInit, OnDestroy {
  @Input() values: OrderPlatformSource[] = [];
  @Input() valueIds: string[] = [];
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
    private mainService: MainService,
    private elemRef: ElementRef,
  ) {}

  ngOnInit(): void {
    // source
    // this.mainService.listSource.pipe(takeUntil(this.destroy)).subscribe({
    //   next: res => {
    //     if (res) {
    //       this.source.rows = res;
    //       this.setupItems();
    //       this.source.isGet = true;
    //     }
    //   }
    // })
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

  mouseover(item?: TypeSource) {
    if (item) {
      this.listTypeSource = this.listTypeSource.map((e) => {
        e.isHover = false;
        if (e.id === item.id) {
          e.isHover = true;
        }
        return e;
      });
    }
    this.isHover = true;
  }

  onSelect(typeSource: TypeSource, source?: Source) {
    // console.log('typeSource', typeSource)
    // console.log('source', source)
    // Có phần tử con thì k cho phép select cha.
    if (!source && typeSource.rows.length) return;

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

    this.values = [...this.listTypeSource, ...this.source.rows]
      .filter((v) => this.valueIds.includes(v.id))
      .map((v) => ({
        id: v.id,
        name: v.name,
        link: v.link,
        picture: v.picture,
        platform: v.platform,
        platformId: v.platformId,
      }));

    this.changePlatformSource.emit(this.values);
    this.changeDefaultData.emit({
      platformSources: this.values,
      platformSourceIds: this.values.map((i) => i.id),
    });

    this.isHover = false;
  }
}
