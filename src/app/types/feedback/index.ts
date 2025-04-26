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
  }[];
}

export interface IFeedbackVideo {
  cover: string;
  url: string;
  id: string;
}

export interface IFeedbackConfig {
  criterias: {
    name: string;
    desc: string;
    density: number;
  }[];
}
