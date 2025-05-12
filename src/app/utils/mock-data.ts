import {SplitConfig} from '@app/types/viewmodels';

export const splitConfigs: SplitConfig[] = [
  {
    id: 'split-config-001',
    name: 'Cấu hình chia số tháng 5',
    applyToOnline: true,
    applyToWorkHours: false,
    roleRatios: [
      {
        roleId: 'role-sale',
        roleName: 'Sale',
        configRatio: [
          {userId: 'user-01', ratio: 60},
          {userId: 'user-02', ratio: 40},
        ],
      },
      {
        roleId: '"65e0990a727526866391d1d7"',
        roleName: 'Marketing',
        configRatio: [
          {userId: 'user-03', ratio: 70},
          {userId: 'user-04', ratio: 30},
        ],
      },
    ],
    reassignRoles: ['65e0990a727526866391d1d7'],

    createdAt: new Date('2025-05-01T10:00:00Z'),
    updatedAt: new Date('2025-05-10T14:30:00Z'),
    updatedBy: {
      id: 'admin-001',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      picture: 'https://example.com/images/nguyenvana.jpg',
    },
  },
];
