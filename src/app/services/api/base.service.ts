import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  private apiAddress = environment.apiAddress;

  constructor(protected httpClient: HttpClient) {}

  protected createParams(params: {[key: string]: any}): HttpParams {
    return Object.keys(params).reduce((m, k) => {
      if (params[k] != null) {
        return m.set(k, params[k].toString());
      }
      return m;
    }, new HttpParams());
  }

  protected createUrl(paths: string[]) {
    return this.apiAddress + '/' + paths.join('/');
  }

  public setApiAddress(apiAddress: string, endpoint: string) {
    this.apiAddress = apiAddress + '/' + endpoint;
    if (this.apiAddress.endsWith('/')) {
      this.apiAddress = this.apiAddress.replace(/\/+$/, '');
    }
  }
}
