import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {environment} from 'src/environments/environment';
import {EntityResult} from 'src/app/types/viewmodels';
import {Observable, Subject, takeUntil} from 'rxjs';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService extends BaseApiService {
  destroy = new Subject();

  constructor(
    private authService: AuthService,
    httpClient: HttpClient,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/storage`,
          );
        }
      },
    });
  }

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.destroy.next(true);
    this.destroy.complete();
  }
  attach(
    accept: 'image/x-png,image/gif,image/jpeg,image/x-icon' | 'audio/mp3',
    size = 2,
    body = {},
  ): Observable<EntityResult<string[]>> {
    return Observable.create(
      (observer: {
        next: (arg0: EntityResult<string[]> | null) => void;
        error: (arg0: string) => void;
      }) => {
        const inputFile: HTMLInputElement = document.createElement('input');
        inputFile.setAttribute('type', 'file');
        inputFile.setAttribute('accept', accept);
        inputFile.click();

        window.onfocus = () => {
          if (inputFile.value.length) {
          } else {
            // observer.error(new Error('Bạn chưa chọn file nào!'))
            observer.next(null);
          }
          window.onfocus = null;
          // console.log('checked');
        };
        inputFile.addEventListener('change', (e: Event) => {
          if (inputFile.files!.length > 0) {
            const file: File = inputFile.files![0];
            // console.log(file)
            if (file.size > size * 1000 * 1024) {
              // ~2Mb
              return observer.error(`File được chọn vượt quá ${size}MB`);
            }
            const formData: FormData = new FormData();
            formData.append('files', file, file.name);

            // Object.keys(body).forEach(key => {
            //   formData.append(key, body[key]);
            // });

            // console.log('formData', formData);
            // observer.next({ loading: true });
            this.httpClient
              .post<EntityResult<string[]>>(
                this.createUrl(['quick-upload']),
                formData,
              )
              .subscribe({
                next: (res) => {
                  observer.next(res);
                },
                error: (error) => {
                  observer.error(error);
                },
              });
          } else {
            observer.error('Chưa có file được chọn');
          }
        });
      },
    );
  }
  attachMulti(
    accept: 'image/x-png,image/gif,image/jpeg,image/x-icon' | 'audio/mp3',
    size = 2,
    body = {},
  ): Observable<EntityResult<string[]>> {
    return Observable.create(
      (observer: {
        next: (arg0: EntityResult<string[]> | null) => void;
        error: (arg0: string) => void;
      }) => {
        const inputFile: any = document.createElement('input');
        inputFile.setAttribute('type', 'file');
        inputFile.setAttribute('multiple', 'multiple');
        inputFile.setAttribute('accept', accept);
        inputFile.click();

        window.onfocus = () => {
          if (inputFile.value.length) {
            // console.log('Files Loaded');
          } else {
            // observer.error(new Error('Bạn chưa chọn file nào!'))
            // console.log('Cancel clicked');
            observer.next(null);
          }
          window.onfocus = null;
          // console.log('checked');
        };
        inputFile.addEventListener('change', (e: MouseEvent) => {
          if (inputFile?.files?.length > 0) {
            const formData: FormData = new FormData();
            // console.log(inputFile?.files);
            if (inputFile?.files?.length > 20) {
              return observer.error(`Chỉ được phép chọn tối đa 20 file ảnh!`);
            }
            for (const file of inputFile?.files) {
              formData.append('files', file, file.name);
              if (file.size > size * 1000 * 1024) {
                // ~2Mb
                return observer.error(`File được chọn vượt quá ${size}MB`);
              }
            }

            // Object.keys(body).forEach(key => {
            //   formData.append(key, body[key]);
            // });

            // observer.next({ loading: true });
            this.httpClient
              .post<EntityResult<string[]>>(
                this.createUrl(['quick-upload']),
                formData,
              )
              .subscribe({
                next: (res) => {
                  observer.next(res);
                },
                error: (error) => {
                  observer.error(error);
                },
              });
          } else {
            observer.error('Chưa có file được chọn');
          }
        });
      },
    );
  }
}
