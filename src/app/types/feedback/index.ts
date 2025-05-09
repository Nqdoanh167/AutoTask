export interface IFeedback {
  rate?: number;
  comment?: string;
  pictures: string[];
  videos?: IFeedbackVideo[];
  source?: string;
  criterias?: {
    name: string;
    rating: number;
    density: number;
    type: string;
    multi_options: {
      text: string;
      star: number;
    }[];
  }[];
  templateId?: string;
}

export interface Template {
  id?: string;
  name: string;
  picture: string;
  isDefault: boolean;
  criterias: {
    name: string;
    density: number;
    type: string;
    configs: [
      {text: string | null; star: 5},
      {text: string | null; star: 4},
      {text: string | null; star: 3},
      {text: string | null; star: 2},
      {text: string | null; star: 1},
    ];
    isMultiSelect: boolean;
  }[];
}

export interface IFeedbackVideo {
  cover: string;
  url: string;
  id: string;
}

export interface IFeedbackConfig {
  syncIntegrations: any[];
  automation: {
    isActive: boolean;
    rates: {
      rate: number;
      blockId: string;
    }[];
  };
  templates: {
    id?: string;
    name: string;
    picture: string;
    isDefault: boolean;
    criterias: {
      name: string;
      density: number;
      type: string;
      configs: [
        {text: null; star: 5},
        {text: null; star: 4},
        {text: null; star: 3},
        {text: null; star: 2},
        {text: null; star: 1},
      ];
      isMultiSelect: boolean;
    }[];
  }[];
}
