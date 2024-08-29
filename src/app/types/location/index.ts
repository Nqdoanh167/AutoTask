export interface IProvince {
  id: string;
  provinceCode: string;
  province: string;
}

export interface IDistrict extends IProvince {
  districtCode: string;
  district: string;
}

export interface IWard extends IDistrict {
  wardCode: string;
  ward: string;
  endWard: any;
}

export interface IParamsSearchLocation {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  location?: string;
  searchField?: string;
  q?: string;
}

export interface ISelectedLocation {
  province?: Pick<IProvince, 'provinceCode' | 'province'>;
  district?: Pick<IDistrict, 'districtCode' | 'district'>;
  ward?: Pick<IWard, 'wardCode' | 'ward'>;
}
