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
import {IFeedback, Template} from '@app/types/feedback';
import {ToastrService} from 'ngx-toastr';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {normalizeToNumberArray} from '@app/utils/common';
import {ITaskChainResult} from '@app/types/flow';

@Component({
  selector: 'app-modal-feedback',
  templateUrl: './modal-feedback.component.html',
  styleUrls: ['./modal-feedback.component.scss'],
})
export class ModalFeedbackComponent implements OnInit, OnDestroy {
  @Input() taskChainResult!: ITaskChainResult;
  @Input() subActionId!: string;
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
    templateId: [null as null | string],
  });

  public isOpenBackdrop = false;

  private criteriaSubject = new BehaviorSubject<any | undefined>(undefined);
  private destroy$ = new Subject<void>();
  public templates: Template[] = [];

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
        if (!data) return;
        this.criteriaArray.clear();
        data.forEach((criteria: any) => {
          if (!criteria.rating && criteria.type === 'rating_star') {
            criteria.rating = 5;
          }
          this.criteriaArray.push(
            this.fb.group({
              id: [criteria.id],
              name: [criteria.name],
              density: [criteria.density],
              rating: [criteria.rating],
              type: [criteria.type],
              multi_options: [criteria.multi_options || []],
              answer: [criteria.answer],
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
            this.templates = res?.data.templates || [];
            const template = this.templates.find((template) => {
              if (this.taskChainResult?.action.templateId) {
                return template.id === this.taskChainResult?.action?.templateId;
              }

              return template.isDefault;
            });
            if (template) {
              this.form.patchValue({
                templateId: template.id,
              });

              this.criteriaSubject.next(template.criterias);
            }
          }
        },
      });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.valid && !this.loading.submit) {
      this.loading.submit = true;
      const body = {
        subActionId: this.subActionId,
        ...this.form.value,
        criterias: this.criteriaArray.value
          .filter((item: any) => item.rating)
          .map((item: any) => ({
            id: item.id,
            rating: item.rating,
            answer: normalizeToNumberArray(item.answer),
          })),
        rate: this.criteriaArray.length
          ? this.getAverageRating()
          : this.form.value.rate,
      } as any as IFeedback;

      this.autoTaskService.taskChainResult
        .sendFeedback(this.taskChainResult?.id as any, body)
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

  getAverageRating() {
    const criterias = this.criteriaArray.controls.map((item) => {
      const rating = item.get('rating')?.value || 0;
      const density = item.get('density')?.value || 0;
      return rating * density;
    });

    const totalDensity = this.criteriaArray.controls.reduce((acc, item) => {
      if (!item.get('rating')?.value) return acc;
      const density = item.get('density')?.value || 0;
      return acc + density;
    }, 0);
    const totalRating = criterias.reduce((acc, item) => {
      if (item === 0) return acc;
      return acc + item;
    }, 0);
    if (!totalDensity) {
      return 0;
    }

    const result = Number((totalRating / totalDensity).toFixed(2));
    return result % 1 === 0 ? Math.floor(result) : result;
  }

  getIsMultiSelect(index: number) {
    const template = this.templates.find(
      (template) => template.id === this.form.value.templateId,
    );
    return template?.criterias?.[index]?.isMultiSelect || false;
  }

  onRatingChange(selectedStars: number[] | number, criteriaIndex: number) {
    const selectedCriteria = this.criteriaArray.at(criteriaIndex);
    const ratingControl = selectedCriteria.get('rating');
    const multiOptionsControl = selectedCriteria.get('multi_options');

    const stars = Array.isArray(selectedStars)
      ? selectedStars
      : [selectedStars];

    const avg = stars.length
      ? stars.reduce((sum, s) => sum + s, 0) / stars.length
      : 0;

    ratingControl?.setValue(avg);

    const options = stars.map((star) => {
      const matched = this.getConfigRating(criteriaIndex)?.find(
        (item) => item.star === star,
      );
      return {
        text: matched?.text || null,
        star: star,
      };
    });

    multiOptionsControl?.setValue(options);
  }

  getConfigRating(index: number) {
    return this.templates
      .find((template) => template.id === this.form.value.templateId)
      ?.criterias[index]?.configs.filter((item) => !!item.text);
  }

  handleChangeTemplate(templateId: string) {
    const template = this.templates.find(
      (template) => template.id === templateId,
    );
    this.criteriaSubject.next(template?.criterias);
  }
}
