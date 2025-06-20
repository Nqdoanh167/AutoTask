import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { ISetting } from '@app/types/setting';
import { flattenData } from '@app/utils/common';
import {BsModalRef, ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ToastrService} from 'ngx-toastr';
import {finalize, Subject, takeUntil} from 'rxjs';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-modal-export-excel',
  templateUrl: './modal-export-excel.component.html',
  styleUrls: ['./modal-export-excel.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalModule,
    TooltipModule,
    DragDropModule,
  ],
  standalone: true,
})
export class ModalExportExcelComponent implements OnInit, OnDestroy {
  @Input() sheetName!: string;
  @Input() rows: any = [];
  @Input() fieldGroupExportExcel: any[] = [];
  @Input() formExportExcel: any;
  @Output() saveConfig = new EventEmitter<string[]>();

  private destroy$ = new Subject();
  form!: FormGroup;
  private config!: ISetting;
  private taskExportFields: string[] = [];
  
  headerCode: any[] = [];
  dataMapping: any[] = [];
  loading = {
    submit: false,
  };

  constructor(
    private fb: FormBuilder,
    private bsModalRef: BsModalRef,
    private autoTaskService: AutoTaskService,
    private toastr: ToastrService,
  ) {}
  ngOnInit(): void {
    this.getConfig();
    this.initializeForm();
    this.extractDataMapping();
    this.setFormValues();
  }

  private initializeForm(): void {
    this.form = this.fb.group(this.formExportExcel);
  }

  private extractDataMapping(): void {
    this.dataMapping = this.fieldGroupExportExcel.flatMap(
      (data: any) => data.fields,
    );
  }

  private setFormValues(): void {
    const fieldValues = Object.fromEntries(
      this.taskExportFields.map((field) => [field, true]),
    );
    this.form.patchValue(fieldValues);
  }

   get headerLabel(): string[] {
    return this.mappingLabelByCode(this.headerCode);
  }

  getConfig() {
    this.autoTaskService.currentSetting.subscribe({
      next: (res) => {
        if (res) {
          this.config = res;
          this.taskExportFields = res.taskExportFields || [];
          this.headerCode = res.taskExportFields || [];
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  hideModal() {
    this.bsModalRef.hide();
  }
  handleResetFieleds() {
    this.form.reset();
    this.headerCode = [];
  }
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.headerCode, event.previousIndex, event.currentIndex);
  }

  onChange(event: any) {
    const item = event.target.value;
    if (this.form.get(item)?.value) {
      this.headerCode.push(item);
    } else {
      this.headerCode = this.headerCode.filter((code) => code !== item);
    }
  }

  mappingLabelByCode(codes: string[]): string[] {
    return codes.map((code) => {
      const field = this.dataMapping.find((f) => f.code === code);
      return field ? field.label : null;
    });
  }
  mappingCodeByLabel(labels: string[]): string[] {
    return labels.map((label) => {
      const field = this.dataMapping.find((f) => f.label === label);
      return field ? field.code : null;
    });
  }

  exportToExcel(data: any[], headers: string[], fileName: string): void {
    const flattenedData = data.map((item) => flattenData(item));
    // Thêm tiêu đề vào dữ liệu
    const dataWithHeaders = [
      this.mappingLabelByCode(headers), // Tiêu đề
      ...flattenedData.map((item) => {
        return headers.map((header) => item[header] || '');
      }),
    ];

    // Chuyển đổi dữ liệu thành worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders);

    // Tạo một workbook và thêm worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Xuất file Excel dưới dạng binary
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    // Lưu file
    const blob = new Blob([excelBuffer], {type: 'application/octet-stream'});
    // saveAs(blob, `${fileName}.xlsx`);
    const downloadURL = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadURL;
    link.download = fileName + '.xlsx';
    link.click();
    link.remove();
  }

  handleExportExcel() {
    this.exportToExcel(this.rows, this.headerCode, this.sheetName);
  }

  handleSaveConfig() {
    this.loading.submit = true;
    this.autoTaskService.setting
      .update({
        ...this.config,
        taskExportFields: [...this.headerCode],
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading.submit = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.saveConfig.emit(this.headerCode);
            this.toastr.success('Lưu cấu hình thành công');
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
