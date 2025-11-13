import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToastrService} from 'ngx-toastr';
import {BsModalRef, BsModalService, ModalModule} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-input-upload-preview',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './input-upload-preview.component.html',
  styleUrl: './input-upload-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputUploadPreviewComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild('inputMultipleFileImage') inputMultipleFileImage:
    | ElementRef<HTMLInputElement>
    | undefined;

  @ViewChild('inputSingleFileImage') inputSingleFileImage:
    | ElementRef<HTMLInputElement>
    | undefined;

  @Input() immediateUpload?: boolean = false;
  @Input() url: string = '';
  @Input() urls: string[] = [];
  @Input() width?: number = 64;
  @Input() height?: number = 64;
  @Input() showButtonRight?: boolean = true;
  @Input() multiple?: boolean = false;
  @Input() previewAll?: boolean = true;
  @Input() sizeMb?: number = 5;
  @Input() maxFiles: number = 10;
  @Input() byUrl?: boolean = false;
  @Output() filesChanges: EventEmitter<File[]> = new EventEmitter();
  @Output() urlsChanges: EventEmitter<string[]> = new EventEmitter();
  @Input() loadingUpload?: boolean = false;

  public files?: File[] = [];
  public imagesSrc: any[] = [];
  public loading = {
    submit: false,
    upload: false,
  };

  public viewAllImageModalRef?: BsModalRef;
  public isOpenBackdrop = false;

  constructor(
    private readonly toastrService: ToastrService,
    private modalService: BsModalService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  uploadFile() {
    if (this.multiple) {
      if (this.inputMultipleFileImage) {
        this.inputMultipleFileImage.nativeElement.click();
      }
    } else {
      if (this.inputSingleFileImage) {
        this.inputSingleFileImage.nativeElement.click();
      }
    }
  }

  handleChooseFile(event: any) {
    try {
      if (event.target.files) {
        const files = [...event.target.files] as File[];
        const totalFiles =
          (files?.length || 0) +
          (this.urls?.length || 0) +
          (this.imagesSrc?.length || 0);
        if (totalFiles > this.maxFiles) {
          this.toastrService.warning(
            `Chỉ được chọn tối đa ${this.maxFiles} file`,
            'Chú ý',
          );
          return;
        }
        if (this.sizeMb) {
          let error = false;
          files?.forEach((file: File) => {
            if (file.size > this.sizeMb! * 1024 * 1024) {
              this.toastrService.warning(
                `File không vượt quá ${this.sizeMb}MB`,
                'Chú ý',
              );
              error = true;
              return;
            }
          });
          if (error) {
            return;
          }
        }
        if (!this.multiple) {
          this.imagesSrc = [];
        }
        this.files = [...event.target.files];
        this.filesChanges.emit(this.files);
        if (this.immediateUpload) {
          this.files = undefined;
        }
        this.loadImage();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public loadImage() {
    if (this.files && this.files[0]) {
      if (!this.multiple) {
        this.imagesSrc = [];
      }
      const numberOfFiles = this.files.length;
      for (let i = 0; i < numberOfFiles; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagesSrc.push(e.target.result);
        };
        reader.readAsDataURL(this.files[i]);
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      }
    }
  }

  removeImage(index: number, type: 'file' | 'url') {
    if (type === 'file') {
      this.files?.splice(index, 1);
      this.imagesSrc.splice(index, 1);
      this.filesChanges.emit(this.files);
    } else {
      this.urls.splice(index, 1);
      this.urlsChanges.emit(this.urls);
    }
  }

  handleClear(): void {
    this.files = undefined;
    this.filesChanges.emit(undefined);
  }

  openModal(template: TemplateRef<void>) {
    this.isOpenBackdrop = true;
    this.viewAllImageModalRef = this.modalService.show(template, {
      class: 'modal-dialog-centered',
    });
    this.viewAllImageModalRef?.onHide?.subscribe(() => {
      this.isOpenBackdrop = false;
    });
  }

  handleUpTop(index: number) {
    // move url at index to fist index of urls
    const url = this.urls[index];
    this.urls.splice(index, 1);
    this.urls.unshift(url);
    this.urlsChanges.emit(this.urls);
  }

  handleAddByUrl($event: any, inputInstance: HTMLInputElement) {
    try {
      if ($event.target.value) {
        if (this.multiple) {
          this.urls.push($event.target.value);
          this.urlsChanges.emit(this.urls);
        } else {
          this.url = $event.target.value;
          this.urlsChanges.emit([this.url]);
        }
      }
      inputInstance.value = '';
    } catch (e) {
      console.log(e);
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loading.upload = this.loadingUpload || false;
  }

  ngOnDestroy() {}
}
