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
