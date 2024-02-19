import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, User} from 'src/app/types/viewmodels';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseApiService {
  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.setApiAddress(environment.apiAddress, '');
  }

  user = {
    get: (id: string) =>
      this.httpClient.get<EntityResult<User>>(this.createUrl(['users', id])),
  };
}
