import {Component, OnInit, ViewChild} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {MainService} from 'src/app/services/api/main.service';
import {Source} from 'src/app/types/viewmodels';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
})
export class SourceComponent implements OnInit {
  @ViewChild('itemModal') itemModal!: ModalDirective;
  items: Source[] = [];

  loading = {
    table: false,
    submit: false,
    drop: false,
  };
  form!: FormGroup;
  listTypeSource: {
    label: string;
    value: string;
    picture: string;
    count: number;
    rows: Source[];
  }[] = [
    {
      label: 'Facebook',
      value: 'FACEBOOK',
      picture: './assets/images/platform_facebook.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Shopee',
      value: 'SHOPEE',
      picture: './assets/images/platform_shopee.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Tiktok',
      value: 'TIKTOK',
      picture: './assets/images/platform_tiktok.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Lazada',
      value: 'LAZADA',
      picture: './assets/images/platform_lazada.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Ladipage',
      value: 'LADIPAGE',
      picture: './assets/images/platform_ladipage.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Tiki',
      value: 'TIKI',
      picture: './assets/images/platform_tiki.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Zalo',
      value: 'ZALO',
      picture: './assets/images/platform_zalo.png',
      count: 0,
      rows: [],
    },
    {
      label: 'Khác',
      value: 'OTHER',
      picture: '',
      count: 0,
      rows: [],
    },
  ];

  formSubmitAttempt = false;
  constructor(
    private fb: FormBuilder,
    private mainService: MainService,
    private toastr: ToastrService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  ngOnInit(): void {
    this.getItems();
  }

  getItems() {
    this.loading.table = true;
    this.autoTaskService.source.get({}).subscribe({
      next: (res) => {
        this.items = res.data;
        this.setupItems();
        this.loading.table = false;
      },
      error: (err) => {
        this.loading.table = false;
      },
    });
  }
  setupItems() {
    this.listTypeSource = this.listTypeSource.map((item) => {
      item.rows = this.items.filter((i) => i.platform === item.value);
      item.count = item.rows.length;
      return item;
    });
    console.log('this.listTypeSource', this.listTypeSource);
  }

  onSubmit() {
    this.formSubmitAttempt = true;
    if (this.form.valid) {
      this.loading.submit = true;
      const action = this.form.value.id
        ? this.autoTaskService.source.update(
            this.form.value.id,
            this.form.value,
          )
        : this.autoTaskService.source.create(this.form.value);

      action.subscribe({
        next: (res) => {
          console.log('res', res);
          if (this.form.value.id) {
            this.toastr.success(`Cập nhật thành công!`);
            const hasItem = this.items.find((i) => i.id === res.data.id);
            if (hasItem) {
              Object.assign(hasItem, res.data);
            }
          } else {
            this.toastr.success(`Thêm ${this.form.value.name} thành công!`);
            this.items.push(res.data);
          }
          this.setupItems();

          this.loading.submit = false;
          this.formSubmitAttempt = false;
          this.itemModal.hide();
        },
        error: (err) => {
          this.loading.submit = false;
          this.formSubmitAttempt = false;
        },
      });
    }
  }
  delItem(item: Source) {
    if (confirm(`Bạn có chắc muốn xóa ${item.name}?`)) {
      this.autoTaskService.source.delete(item.id).subscribe({
        next: (res) => {
          this.toastr.success(`Xóa ${item.name} thành công!`);
          this.items = this.items.filter((i) => i.id !== item.id);
          this.setupItems();
        },
      });
    }
  }

  showModal(item: Source | null = null) {
    this.form = this.fb.group(this.generatorForm());
    if (item) {
      this.form.patchValue(item);
    }
    this.itemModal.show();
  }
  isFieldValid({control, field}: {control: AbstractControl; field: string}) {
    return (
      (!control.get(field)?.valid && control.get(field)?.touched) ||
      (!control.get(field)?.valid &&
        control.get(field)?.untouched &&
        this.formSubmitAttempt)
    );
  }
  generatorForm() {
    return {
      id: null,
      name: [null, Validators.required],
      platform: [null, Validators.required],
      platformId: null,
      picture: null,
      desc: null,
      isActive: true,
    };
  }
}
