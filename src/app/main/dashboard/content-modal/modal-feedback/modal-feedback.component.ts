import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  distinctUntilChanged,
  finalize,
  Subject,
  takeUntil,
} from 'rxjs';
import {StorageService} from '@app/services/api/storage.service';
import {FeedbackService} from '@app/services/api/feeback.service';
import {IFeedback} from '@app/types/feedback';
import {ToastrService} from 'ngx-toastr';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ITaskChainResult} from '@app/types/flow';

@Component({
  selector: 'app-modal-feedback',
  templateUrl: './modal-feedback.component.html',
  styleUrls: ['./modal-feedback.component.scss'],
})
export class ModalFeedbackComponent implements OnInit, OnDestroy {
  @Input() taskChainResultId!: string;
  @Output() successEvent = new EventEmitter();

  public loading = {
    getConfig: false,
    upload: false,
    submit: false,
  };
  public submitted = false;
  public form = this.fb.group({
    rate: [5, [Validators.required, this.rateValidator]],
    comment: [null],
    pictures: [null],
    videos: [null],
    criterias: this.fb.array([]),
  });

  public isOpenBackdrop = false;

  private criteriaSubject = new BehaviorSubject<any | undefined>(undefined);
  private destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly storageService: StorageService,
    private readonly feedbackService: FeedbackService,
    private readonly toastr: ToastrService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.form.controls;
  }

  get criteriaArray() {
    return this.form.get('criterias') as FormArray;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return (
      !!control &&
      control.invalid &&
      (control.dirty || control.touched || this.submitted)
    );
  }

  rateValidator(control: AbstractControl): {[key: string]: boolean} | null {
    return control.value > 0 ? null : {invalidRate: true};
  }

  ngOnInit() {
    this.isOpenBackdrop = true;
    this.getConfig();

    this.criteriaSubject
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((data) => {
        this.criteriaArray.clear();
        const criterias = data || [];
        criterias.forEach((criteria: any) => {
          this.criteriaArray.push(
            this.fb.group({
              name: [criteria.name],
              density: [criteria.density],
              rating: [5],
            }),
          );
        });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getConfig() {
    if (this.loading.getConfig) return;
    this.loading.getConfig = true;
    this.feedbackService.config
      .get()
      .pipe(
        finalize(() => (this.loading.getConfig = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.criteriaSubject.next(res.data.criterias);
          }
        },
      });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.valid && !this.loading.submit) {
      this.loading.submit = true;
      const body = {
        ...this.form.value,
        rate: this.criteriaArray.length
          ? this.getAverageRating()
          : this.form.value.rate,
      } as any as IFeedback;

      this.autoTaskService.taskChainResult
        .sendFeedback(this.taskChainResultId, body)
        .pipe(
          finalize(() => {
            this.loading.submit = false;
            this.submitted = false;
            this.hideModal();
          }),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.toastr.success('Gửi đánh giá thành công!!');
              this.successEvent.emit(res.data);
            }
          },
        });
    }
  }

  hideModal() {
    this.isOpenBackdrop = false;
    this.modalRef.hide();
  }

  async handleChangeMedia(images: File[]) {
    try {
      const response = (await this.uploadImages(images)) as string[];
      if (response) {
        this.form.patchValue({
          pictures: [...(this.f['pictures'].value || []), ...response],
        } as any);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async uploadImages(files: File[]) {
    return new Promise((resolve, reject) => {
      if (this.loading.upload) {
        return;
      }
      this.loading.upload = true;
      this.storageService
        .uploadFiles(files)
        .pipe(
          finalize(() => (this.loading.upload = false)),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res?.data) {
              resolve(res.data);
            }
          },
        });
    });
  }

  handleUrlMediaChanges(urls: string[]) {}

  onRatingSet(value: number) {
    this.form.patchValue({
      rate: value,
    });
  }

  onCriteriaRatingSet(value: number, index: number) {
    const criteria = this.criteriaArray.at(index) as FormGroup;
    criteria.patchValue({
      rating: value,
    });
  }

  getAverageRating() {
    const criterias = this.criteriaArray.controls.map((item) => {
      const rating = item.get('rating')?.value || 0;
      const density = item.get('density')?.value || 0;
      return rating * density;
    });

    const totalDensity = this.criteriaArray.controls.reduce(
      (acc, item) => acc + (item.get('density')?.value || 0),
      0,
    );
    const totalRating = criterias.reduce((acc, item) => acc + item, 0);
    if (!totalDensity) {
      return 0;
    }

    const result = Number((totalRating / totalDensity).toFixed(2));
    return result % 1 === 0 ? Math.floor(result) : result;
  }
}
