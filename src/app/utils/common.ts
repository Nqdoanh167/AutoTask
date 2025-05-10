import moment from 'moment/moment';
import {ToastrService} from 'ngx-toastr';
import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import get from 'lodash/get';
import {StorageService} from '../services/api/storage.service';

export const diffMinutes = (minuend: any, subtrahend: any): number => {
  subtrahend = moment(subtrahend).toDate();
  minuend = moment(minuend).toDate();
  let diff = (minuend.getTime() - subtrahend.getTime()) / 1000;
  diff /= 60;
  return diff;
};

export const calculateTime = (
  subtrahend?: any,
  minuend?: any,
  typeReturn: 'metrics' | 'string' = 'string',
) => {
  if (!subtrahend) return '-';
  let diff = diffMinutes(subtrahend, minuend);

  let string = '';
  const minutes = Math.abs(Math.round(diff));

  // Calculate the number of minutes
  const remainingMinutes = minutes % 60;
  string = `${remainingMinutes}m`;

  // Calculate the number of hours
  const hours = Math.floor((minutes % 1440) / 60);
  string = hours
    ? remainingMinutes
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`
    : string;

  // Calculate the number of days
  const days = Math.floor(minutes / 1440);
  // assign variable string combine days, hours, minutes, if one of them is not 0
  string = days
    ? hours
      ? remainingMinutes
        ? `${days}d ${hours}h ${remainingMinutes}m`
        : `${days}d ${hours}h`
      : remainingMinutes
        ? `${days}d ${remainingMinutes}m`
        : `${days}d`
    : string;

  if (typeReturn === 'metrics') {
    return {
      days,
      hours,
      minutes: remainingMinutes,
    };
  }
  return string;
};

export const sortBy = <T extends unknown>(
  sortOrder: number,
  sortProperty: string,
  property: string,
) => {
  let sortQuery = `${property}`;
  if (sortProperty === property) {
    if (sortOrder === 0) {
      sortOrder = 1;
      sortQuery = `-${property}`;
    } else if (sortOrder === 1) {
      sortOrder = -1;
      sortQuery = `${property}`;
    } else if (sortOrder === -1) {
      sortOrder = 0;
      sortQuery = '';
    }
  } else {
    sortProperty = property;
    sortOrder = 1;
    sortQuery = `-${property}`;
  }
  return {sortProperty, sortOrder, sortQuery};
};

export const sortIcon = (
  property: string,
  sortProperty: string,
  sortOrder: number,
) => {
  if (property === sortProperty) {
    switch (sortOrder) {
      case -1: {
        return '<i class="fa-solid fa-caret-up mx-1"></i>';
      }
      case 1: {
        return '<i class="fa-solid fa-caret-down mx-1"></i>';
      }
      case 0: {
        return '<i class="fas fa-sort sort-none mx-1"></i>';
      }
      default:
        return '<i class="fas fa-sort sort-none mx-1"></i>';
    }
  }
  return '<i class="fas fa-sort sort-none mx-1"></i>';
};

export const sortByClient = <T extends unknown>(
  data: T[],
  staticData: T[],
  sortOrder: number = 1,
  sortProperty: string,
  property: string,
  isNumber?: boolean,
) => {
  if (sortProperty === property) {
    if (sortOrder === 0) {
      sortOrder = 1;
    } else if (sortOrder === 1) {
      sortOrder = -1;
    } else if (sortOrder === -1) {
      sortOrder = 0;
      data = [...staticData];
      return {data, sortProperty, sortOrder: 0};
    }
  }
  sortProperty = property;
  data = [
    ...data.sort((a, b) => {
      // sort comparison function by field
      let result = 0;
      let aValue = isNumber ? Number(get(a, property)) : get(a, property);
      let bValue = isNumber ? Number(get(b, property)) : get(b, property);
      if (!aValue || aValue < bValue) {
        result = -1;
      }
      if (!bValue || aValue > bValue) {
        result = 1;
      }
      return result * sortOrder;
    }),
  ];
  return {data, sortProperty, sortOrder};
};

@Injectable({
  providedIn: 'root',
})
export class UploadFile {
  public type: 'audio' | 'image' = 'image';
  public isMultiple = false;
  public maxQuantity = 2;
  public listUrls$ = new BehaviorSubject<string[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService,
  ) {}

  upload() {
    this.isLoading$.next(true);
    let accept: 'image/x-png,image/gif,image/jpeg,image/x-icon' | 'audio/mp3' =
      'audio/mp3';
    if (this.type === 'image') {
      accept = 'image/x-png,image/gif,image/jpeg,image/x-icon';
    }
    if (this.isMultiple) {
      this.storageService.attachMulti(accept, 2, this.maxQuantity).subscribe({
        next: (res) => {
          if (res) this.isLoading$.next(false);
          if (res?.data?.length) {
            this.listUrls$.next(res.data);
          }
        },
        error: (err) => {
          this.toastr.warning(err);
          this.isLoading$.next(false);
        },
        complete: () => {
          this.isLoading$.next(false);
        },
      });
    } else {
      this.storageService.attach(accept, 2).subscribe({
        next: (res) => {
          if (res) this.isLoading$.next(false);
          if (res?.data?.length) {
            this.listUrls$.next(res.data);
          }
        },
        error: (err) => {
          this.toastr.warning(err);
          this.isLoading$.next(false);
        },
        complete: () => {
          this.isLoading$.next(false);
        },
      });
    }
  }
}

export const getObjectKeys = (obj: any): string[] => {
  if (!obj) return [];
  return Object.keys(obj);
};

export const getObjectValues = (obj: any): string[] => {
  if (!obj) return [];
  return Object.values(obj);
};

export const getPhoneVNFromText = (text: string) => {
  const phones = [];
  if (text) {
    const patternPhone =
      '(84|0[1-9][., ]?[0-9]?|01[., ]?[2689])[0-9]?[., ]?[0-9]{1,3}[., ]?[0-9]{1,3}[., ]?[0-9]{1,3}';
    const reg = new RegExp('(' + patternPhone + ')', 'g');
    const match: any = text.match(reg);
    // tslint:disable-next-line:forin
    for (const i in match) {
      const phoneNumber = checkPhoneVN(match[i]);
      if (phoneNumber) {
        phones.push(phoneNumber);
      } else {
        const patt =
          /(?:(0|\+84))([0-9]{2,4})[-. ]?(\d{3})[-. ]?(\d{4}|\d{3})\b/gim;
        const isPhone = match[i].match(patt);
        if (isPhone?.length) {
          phones.push(...isPhone);
        }
      }
    }
  }
  return phones;
};

export const checkPhoneVN = (num: string) => {
  let phoneNumber = null;
  let check = true;

  phoneNumber = num;
  // phoneNumber = (typeof num === 'string') ? num.replace(/[^0-9]/g, '') : num;

  // replace 84|+84 => 0
  let dauso = phoneNumber.substring(0, 3);
  if (dauso.indexOf('84') > -1) {
    dauso = dauso.replace(/[+]/, '');
    dauso = dauso.replace('84', '0');
    phoneNumber = phoneNumber.replace(phoneNumber.substring(0, 3), dauso);
  }
  // kiem tra chieu dai
  dauso = phoneNumber.substring(0, 2);
  // var so_tieo_dauso = phoneNumber.substring(2, 3);

  if (phoneNumber.length < 10 || phoneNumber.length > 11) {
    check = false;
  } else if (
    (dauso === '01' || dauso === '02') &&
    (phoneNumber.length < 10 || phoneNumber.length > 11)
  ) {
    check = false;
  } else if (dauso !== '01' && dauso !== '02' && phoneNumber.length !== 10) {
    check = false;
  }
  // console.log(phoneNumber,dauso,so_tieo_dauso,check);
  if (check) {
    return phoneNumber;
  } else {
    return false;
  }
};

export const trimValue = (
  value: string,
  type: 'number' | 'string',
): string | undefined => {
  if (value) return undefined;
  if (type === 'string') return value.trim();
  if (type === 'number') {
    const numberString = String(value);
    return numberString.replace(/^0+/, '');
  }
  return value;
};

export const getLastValueObject = (obj: any): any => {
  if (!obj) return null;
  const keys = Object.keys(obj);
  return {
    key: keys[keys.length - 1],
    value: obj[keys[keys.length - 1]],
  };
};

export function compareObjects(obj1: any, obj2: any): boolean {
  // Get the keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (!keys1.length && !keys2.length) {
    return false;
  }

  // Iterate through the keys of the first object
  for (const key of keys1) {
    // Check if the key exists in the second object
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }

    // Check if the values of the keys are equal
    if (obj1[key] !== obj2[key]) {
      console.log('111', obj1[key]);
      console.log('222', obj2[key]);
      return false;
    }
  }

  // If all checks pass, the objects have the same key-value pairs
  return true;
}

export function removeCharacter(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

export function filterItems<T>(
  items: T[],
  fields: (keyof T)[],
  value: string,
): T[] {
  const lowerValue = value.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const fieldValue = item[field];
      return (
        typeof fieldValue === 'string' &&
        fieldValue.toLowerCase().includes(lowerValue)
      );
    }),
  );
}
