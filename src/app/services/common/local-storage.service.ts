import {Injectable} from '@angular/core';
import {isEmpty} from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}

  setItem(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: string) {
    return JSON.parse(localStorage.getItem(key) || '{}');
  }

  updateItem(key: string, value: any) {
    const data = this.getItem(key);
    this.setItem(key, {...data, ...value});
  }

  removeItem(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}
