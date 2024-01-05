import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, ManageQueue} from 'src/app/types/viewmodels';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService extends BaseApiService {
  api = {
    manageQueue: 'manage-queues',
  };
  private defaultParams: any = {};
  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.setApiAddress(environment.apiModule, `admin/${environment.module}`);
  }

  manageQueue = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<ManageQueue[]>>(
        this.createUrl([this.api.manageQueue]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<ManageQueue>>(
        this.createUrl([this.api.manageQueue]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<ManageQueue>>(
        this.createUrl([this.api.manageQueue, id]),
        body,
      ),
    updatePos: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<ManageQueue>>(
        this.createUrl([this.api.manageQueue, id, 'pos']),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<ManageQueue>>(
        this.createUrl([this.api.manageQueue, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<ManageQueue>>(
        this.createUrl([this.api.manageQueue, id]),
      ),
    clearjob: (body = {}) =>
      this.httpClient.post<EntityResult<{}>>(
        this.createUrl([this.api.manageQueue, 'clearjob']),
        body,
      ),
  };
  copyText(text: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    console.log('Copy text to Clipboard success!');
  }
}
