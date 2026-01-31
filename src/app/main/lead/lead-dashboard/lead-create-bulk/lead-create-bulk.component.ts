import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {OnDestroy} from '@angular/core';
import {LeadDashboardData} from '../lead-dashboard.definition';
import {CustomModalComponent} from '@app/share/custom/custom-modal/custom-modal.component';
import {CommonModule} from '@angular/common';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {ISource} from '@app/types/setting';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {lastValueFrom} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {IProgress} from '@app/types/viewmodels';
import {ILeadCreateBulk} from '@app/types/lead';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
@Component({
  selector: 'app-lead-create-bulk',
  templateUrl: './lead-create-bulk.component.html',
  styleUrls: ['./lead-create-bulk.component.scss'],
  standalone: true,
  imports: [
    CustomModalComponent,
    CommonModule,
    TabsModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    TooltipModule,
    ProgressbarModule,
  ],
})
export class LeadCreateBulkComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Output() success = new EventEmitter<void>();
  @Input() funnelId!: string;
  public loading = {
    isSubmitting: false,
  };
  public form!: FormGroup;
  public submitted = false;
  public activeTab: 'manual' | 'upload' = 'manual';
  public fieldDefaults: {
    key: string;
    label: string;
    type: 'input' | 'select';
    required?: boolean;
    multiple?: boolean;
    isValid?: boolean;
  }[] = [
    {
      key: 'name',
      label: 'Tên',
      type: 'input',
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: 'input',
      required: true,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'input',
    },
    {
      key: 'note',
      label: 'Ghi chú',
      type: 'input',
    },
    {
      key: 'sourceId',
      label: 'Nguồn',
      type: 'select',
      multiple: true,
    },
    {
      key: 'tags',
      label: 'Tag',
      type: 'select',
      multiple: true,
    },
  ];

  public progress: IProgress = {
    status: 'init',
    type: 'info',
    value: 0,
    size: 50,
  };

  constructor(
    private readonly bsModalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
  ) {
    super();
  }

  get f(): {[key: string]: AbstractControl} {
    return this.form.controls;
  }

  get leadFormArray(): FormArray {
    return this.f['leads'] as FormArray;
  }

  sourceIdControl(index: number): FormControl {
    return this.leadFormArray.controls[index].get('sourceId') as FormControl;
  }

  isFieldInvalid(field: string, index: number): boolean {
    return (
      !!this.leadFormArray.controls[index]?.get(field)?.errors && this.submitted
    );
  }

  groupByPlatform = (item: ISource) => {
    return `${item.platform}`;
  };

  override ngOnInit(): void {
    this.getSource();
    this.getTags();

    this.form = this.fb.group({
      leads: this.fb.array([
        this.fb.group({
          name: [''],
          phone: ['', [Validators.required]],
          email: [''],
          note: [''],
          sourceId: [null],
          tagIds: [[]],
        }),
      ]),
    });
  }

  addRow(index: number): void {
    this.leadFormArray.insert(
      index + 1,
      this.fb.group({
        name: [''],
        phone: ['', [Validators.required]],
        email: [''],
        note: [''],
        sourceId: [null],
        tagIds: [[]],
      }),
    );
  }

  removeRow(index: number): void {
    this.leadFormArray.removeAt(index);
  }

  onCancel(): void {
    this.bsModalRef.hide();
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading.isSubmitting = true;
    const chunks = this.chunkArray(this.form.value.leads, this.progress.size);
    const increment = 100 / chunks.length;
    this.progress.status = 'progress';
    this.progress.type = 'info';
    for (const chunk of chunks) {
      try {
        await lastValueFrom(
          this.leadService.lead.createBulk({
            funnelId: this.funnelId,
            leads: chunk,
          } as ILeadCreateBulk),
        );
        this.progress.value = Math.min(this.progress.value + increment, 100);
      } catch (err) {
        console.error('Error during bulk create:', err);
        this.progress.status = 'error';
        this.progress.type = 'danger';
        this.toastrService.error('Lỗi khi tạo lead');
      }
    }

    if (this.progress.value === 100) {
      setTimeout(() => {
        this.progress.status = 'success';
        this.progress.type = 'success';
        this.toastrService.success('Tạo lead thành công');
        this.success.emit();
        this.onCancel();
      }, 3000);
    }
  }
}
