import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, Biz} from 'src/app/types/viewmodels';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BizService extends BaseApiService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.setApiAddress(environment.apiAddress, '');
  }

  biz = {
    get: (id: string) =>
      this.httpClient.get<EntityResult<Biz>>(
        this.createUrl(['bizs', id, 'modules', 'auto-task']),
      ),
  };
}
