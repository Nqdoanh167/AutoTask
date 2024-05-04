export interface Platform {
  id: string;
  author: string;
  updatedBy: {
    id: string;
    name: string;
    picture: string;
    email: string;
  };
  bizId: string;
  name: string;
  platformType: string;
  platform: string;
  stringee?: {
    key: string;
    secret: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
