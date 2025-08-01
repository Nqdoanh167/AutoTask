import {CommonModule} from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {BsModalRef, ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ToastrService} from 'ngx-toastr';
import {finalize, lastValueFrom, Subject, takeUntil} from 'rxjs';
import * as XLSX from 'xlsx';
import {CustomModalComponent} from '../../custom/custom-modal/custom-modal.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {DashboardData} from '../standard-table/dashboard-data';
import {NgSelectModule} from '@ng-select/ng-select';
import {v4 as uuidv4} from 'uuid';
import {ProgressbarModule, ProgressbarType} from 'ngx-bootstrap/progressbar';

@Component({
  selector: 'app-modal-import-excel',
  templateUrl: './modal-import-excel.component.html',
  styleUrls: ['./modal-import-excel.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule,
    TooltipModule,
    CustomModalComponent,
    ScrollingModule,
    NgSelectModule,
    ProgressbarModule,
  ],
  standalone: true,
})
export class ModalImportExcelComponent
  extends DashboardData
  implements OnInit, OnDestroy
{
  @Output() importData = new EventEmitter<any[]>();
  @Output() saveData = new EventEmitter<any[]>();

  form!: FormGroup;
  submitted = false;
  selectedFile: File | null = null;
  loading = {
    import: false,
    save: false,
  };

  public fieldDefaults: {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    multiple?: boolean;
    isValid?: boolean;
  }[] = [
    {
      key: 'name',
      label: 'Tên tác vụ',
      type: 'input',
      required: true,
    },
    {
      key: 'leadDeal_name',
      label: 'Tên khách hàng',
      type: 'input',
      required: true,
    },
    {
      key: 'leadDeal_phone',
      label: 'Số điện thoại khách hàng',
      type: 'input',
    },
    {
      key: 'leadDeal_address',
      label: 'Địa chỉ khách hàng',
      type: 'input',
    },
    {
      key: 'branch_name',
      label: 'Chi nhánh',
      required: true,
    },
    {
      key: 'tags',
      label: 'Danh sách tag',
      multiple: true,
    },
    {
      key: 'chatLink',
      label: 'Link cuộc hội thoại',
      type: 'input',
    },
  ];

  public progressStatus: string | 'processing' | 'success' | 'error' = '';
  public progressValue = 0;
  public progressMax = 100;
  public progressType: ProgressbarType = 'info';

  constructor(
    private fb: FormBuilder,
    private bsModalRef: BsModalRef,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.clickLoadData('tags')
    this.form = this.fb.group({
      isOverwrite: [true],
      tasks: this.fb.array([]),
    });
  }

  get taskArrayForm(): FormArray {
    return this.form.get('tasks') as FormArray;
  }

  isFieldInvalid(field: string, group: FormGroup): boolean {
    const control = group?.get(field);
    return (
      !!control &&
      control.invalid &&
      (control.dirty || control.touched || this.submitted)
    );
  }

  trackById(index: number, item: any): string {
    return item.id;
  }

  onFileSelected(event: any): void {
    const allowedExtensions = ['.xls', '.xlsx'];
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name
          .substring(file.name.lastIndexOf('.'))
          .toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        this.toastr.warning('Vui lòng chọn file Excel có định dạng .xls hoặc .xlsx');
        return;
      }
      this.selectedFile = file;
      this.readExcelFile(file);
    }
  }

  private readExcelFile(file: File): void {
    this.loading.import = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

        if (jsonData.length > 0) {
          this.taskArrayForm.clear();

          const headers = jsonData[0] as string[];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const taskForm = this.fb.group({});

            this.fieldDefaults.forEach((field) => {
              const headerIndex = headers.findIndex((header) => {
                if (!header) return false;
                const headerStr = header.toString().trim().toLowerCase();
                return headerStr === field.label.toLowerCase();
              });

              let fieldValue = field.multiple ? [] : '';
              let validators = [];

              if (headerIndex !== -1 && headerIndex < row.length) {
                const rawValue = row[headerIndex] ?? '';
                fieldValue = field.multiple
                  ? rawValue
                    ? rawValue
                        .toString()
                        .split(',')
                        .map((item: string) => item.trim())
                        .filter((item: string) => item.length > 0)
                    : []
                  : rawValue;

                if (field.key === 'branch_name' && fieldValue) {
                  const branchExists = this.currentUser?.branches?.some(
                    (branch: any) =>
                      branch.name.toLowerCase() ===
                      fieldValue?.toString().toLowerCase(),
                  );

                  if (!branchExists) {
                    fieldValue = '';
                  }
                }
              }

              if (field.required) {
                validators.push(Validators.required);
              }

              taskForm.addControl(
                field.key,
                this.fb.control(fieldValue, validators),
              );
            });

            // Bổ sung id vào taskForm
            taskForm.addControl('id', this.fb.control(uuidv4()));

            this.taskArrayForm.push(taskForm);
          }
        }
      } catch (error) {
        this.toastr.error('Lỗi khi đọc file Excel');
        console.error('Error reading Excel file:', error);
      } finally {
        this.loading.import = false;
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async handleSubmit(): Promise<void> {
    this.submitted = true;
    if(this.form.invalid) {
      return
    }
    this.loading.save = true;

    try {
      const formData = this.form.value;
      const transformedData = formData.tasks.map((task: any, index: number) => {
        const taskFormGroup = this.taskArrayForm.at(index);
        const isValid = taskFormGroup.valid;

        return {
          name: task.name || null,
          leadDeal: {
            name: task.leadDeal_name || null,
            phone: task.leadDeal_phone || null,
            address: task.leadDeal_address || null,
          },
          branch: {
            id: this.currentUser?.branches?.find(branch => 
              branch.name.toLowerCase() === (task.branch_name || '').toLowerCase()
            )?.id || null,
            name: task.branch_name || null,
          },
          tags: (task.tags || []).map((tag: string)=> this.tags.rows.find(t => t.name.toLowerCase() === tag.toLowerCase())?.id).filter((id: any) => id) || [],
          chatLink: task.chatLink || null,
          isValid,
        };
      }).filter((task: any) => task.isValid);
      await this.createTasksWithProgress(transformedData);
    } catch (error) {
      this.toastr.error('Có lỗi xảy ra khi xử lý dữ liệu');
      console.error('Error processing data:', error);
      this.progressStatus = 'error';
    } finally {
      this.loading.save = false;
      setTimeout(() => {
        this.getDataSource(true)
      }, 3000);
    }
  }

  async createTasksWithProgress(tasks: any[], chunkSize = 1): Promise<void> {
    const chunks = this.chunkArray(tasks, chunkSize);
    const totalChunks = chunks.length;
    const increment = 100 / totalChunks;

    this.progressStatus = 'processing';
    this.progressValue = 0;
    this.progressMax = 100;
    this.progressType = 'info';

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        await this.createTaskBatch(chunk);

        this.progressValue = Math.min((i + 1) * increment, 100);

        if (i < chunks.length - 1) {
          await this.delay(500);
        }
      }

      await this.delay(300);

      this.progressStatus = 'success';
      this.progressType = 'success';

      this.toastr.success(
        `Đã tạo thành công ${tasks.length} tác vụ`,
        'Thành công',
      );
    } catch (error) {
      this.progressStatus = 'error';
      this.progressType = 'danger';
      throw error;
    }
  }

  private async createTaskBatch(tasks: any[]): Promise<any> {
     tasks.forEach(async (task: any) => {
      await lastValueFrom(this.autoTaskService.task.create(task));
    })
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  downloadTemplate() {
    try {
      const headers = this.fieldDefaults.map(field => field.label);
      
      const firstBranch = this.currentUser?.branches?.[0]?.name || 'Chi nhánh mặc định';
      
      const sampleData = [
        [
          'Tác vụ mẫu 1',
          'Nguyễn Văn A',
          '0123456789',
          '123 Đường ABC, Quận 1, TP.HCM',
          firstBranch,
          'tag1, tag2',
          'https://example.com/chat1'
        ],
        [
          'Tác vụ mẫu 2',
          'Trần Thị B',
          '0987654321',
          '456 Đường XYZ, Quận 2, TP.HCM',
          firstBranch,
          'tag3, tag4',
          'https://example.com/chat2'
        ],
        [
          'Tác vụ mẫu 3',
          'Lê Văn C',
          '0111222333',
          '789 Đường DEF, Quận 3, TP.HCM',
          firstBranch,
          'tag5',
          'https://example.com/chat3'
        ],
        [
          'Tác vụ mẫu 4',
          'Phạm Thị D',
          '0444555666',
          '321 Đường GHI, Quận 4, TP.HCM',
          firstBranch,
          'tag6, tag7, tag8',
          'https://example.com/chat4'
        ],
        [
          'Tác vụ mẫu 5',
          'Hoàng Văn E',
          '0777888999',
          '654 Đường JKL, Quận 5, TP.HCM',
          firstBranch,
          'tag9, tag10',
          'https://example.com/chat5'
        ]
      ];
      
      const worksheetData = [headers, ...sampleData];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tác vụ mẫu');
      
      XLSX.writeFile(workbook, 'file_mau_tac_vu.xlsx');
      
    } catch (error) {
      console.error('Lỗi khi tạo file mẫu:', error);
      this.toastr.error('Có lỗi xảy ra khi tải xuống file mẫu', 'Lỗi');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files?.[0]) {
      const fileInput = document.getElementById(
        'fileExcel',
      ) as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInput.files = dataTransfer.files;
      this.onFileSelected({target: fileInput});
    }
  }
  
  hideModal(): void {
    this.bsModalRef.hide();
  }
}
