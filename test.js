const filter = `{
  "sort": "-createdAt",
  "isHideExecute": true,
  "branchIds": ["68468d8edd73180012113f93"],
  "teamRoles": [
    "68468d8edd73180012113f96",
    "68468d8edd73180012113f97",
    "68468d8edd73180012113f98"
  ],
  "teamId": ["65e142259aa2455d7f92e6c8","65e153749aa2455d7f92ecc1"],
  "tags":["685e07ba8c8bd0d4f95b9e6c"],
  "sourceIds":["6846ae4cff014aa196a0c5cc", "FACEBOOK"],
  "createdBy":"65e153749aa2455d7f92ecc1",
  "chainActId":"6846956a3e7afc6bf4cd635e",
  "actionIds":["684bd8f430ec13c82a663022"],
  "resultIds":["68468f38d51cb88467c2dec4"],
  "unassignedRoleId":"68468d8edd73180012113f98"
}`;

const checkTaskFilter = (task) => {
  try {
    const filterQuery = JSON.parse(filter || '{}');

    if (filterQuery.branchIds && filterQuery.branchIds.length > 0) {
      if (!task.branch?.id || !filterQuery.branchIds.includes(task.branch.id)) {
        return false;
      }
    }

    if (filterQuery.teamRoles && filterQuery.teamRoles.length > 0) {
      const taskTeamRoleIds =
        task.teams
          ?.map((team) => {
            if (team.userId) return team.roleId;
            return null;
          })
          .filter(Boolean) || [];

        console.log('taskTeamRoleIds', taskTeamRoleIds);
      const hasMatchingRole = filterQuery.teamRoles.some((roleId) =>
        taskTeamRoleIds.includes(roleId),
      );
      if (!hasMatchingRole) {
        return false;
      }
    }

    if (filterQuery.teamId && filterQuery.teamId.length > 0) {
      const taskUserIds = task.teams?.map((team) => team.userId) || [];
      const hasMatchingUser = filterQuery.teamId.some((userId) =>
        taskUserIds.includes(userId),
      );
      if (!hasMatchingUser) {
        return false;
      }
    }

    if (filterQuery.tags && filterQuery.tags.length > 0) {
      const taskTagIds = task.tags || [];
      const hasMatchingTag = filterQuery.tags.some((tagId) =>
        taskTagIds.includes(tagId),
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    if (filterQuery.sourceIds && filterQuery.sourceIds.length > 0) {
      const taskPlatformSourceIds = task.platformSourceIds || [];
      const hasMatchingPlatformSource = filterQuery.sourceIds.some((sourceId) =>
        taskPlatformSourceIds.includes(sourceId),
      );
      if (!hasMatchingPlatformSource) {
        return false;
      }
    }

    if (filterQuery.createdAt && filterQuery.createdAt.length === 2) {
      const taskCreatedAt = new Date(task.createdAt);
      const startDate = new Date(filterQuery.createdAt[0]);
      const endDate = new Date(filterQuery.createdAt[1]);

      if (taskCreatedAt < startDate || taskCreatedAt > endDate) {
        return false;
      }
    }

    if (filterQuery.createdBy) {
      if (task.createdBy.id !== filterQuery.createdBy) {
        return false;
      }
    }

    // chainActId
    if (filterQuery.chainActId) {
      const hasMatchingChain = task.taskChains?.some(
        (chain) => chain.chainActId === filterQuery.chainActId,
      );
      if (!hasMatchingChain) {
        return false;
      }
    }

    // actionIds
    if (filterQuery.actionIds && filterQuery.actionIds.length > 0) {
      const actionIds = task.taskChains.flatMap((chain) =>
        chain.taskChainResults.flatMap((result) => {
          const ids = [];
          if (result.action?.id) ids.push(result.action.id);
          if (result.subActions?.length) {
            ids.push(...result.subActions.map((sa) => sa.id));
          }
          return ids;
        }),
      );
      const hasMatchingAction = filterQuery.actionIds.some((actionId) =>
        actionIds.includes(actionId),
      );
      if (!hasMatchingAction) {
        return false;
      }
    }

    // resultIds
    if (filterQuery.resultIds && filterQuery.resultIds.length > 0) {
      const resultIds = task.taskChains
        .flatMap((chain) =>
          chain.taskChainResults.map(
            (taskChainResult) => taskChainResult.result?.id,
          ),
        )
        .filter(Boolean);
      const hasMatchingResult = filterQuery.resultIds.some((resultId) =>
        resultIds.includes(resultId),
      );
      if (!hasMatchingResult) {
        return false;
      }
    }

    // unassignedRoleId
    if (filterQuery.unassignedRoleId) {
      const hasMatchingUnassignedRole = task.teams?.some(
        (team) => team.roleId === filterQuery.unassignedRoleId && !team.userId,
      );
      if (!hasMatchingUnassignedRole) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in checkTaskFilter:', error);
    return true;
  }
};

const task = {
  createdBy: {
    id: '65e153749aa2455d7f92ecc1',
    name: 'TrangDT',
    picture:
      'https://s3.smax.in/users/1709266277761-65e153749aa2455d7f92ecc1.jpg',
    email: 'trangxinhngoanyeu@viktech.com',
  },
  bizId: '68468d8edd73180012113f92',
  name: 'task tét',
  chatLink: null,
  note: null,
  branch: {
    id: '68468d8edd73180012113f93',
    name: 'Tổng',
    department: null,
    departmentName: null,
    team: null,
    teamName: null,
    unit: 'BRANCH',
  },
  leadDeal: {
    id: '685e1bc6b5df4dc25df60c26',
    type: 'LEAD',
    name: 'Ngọc Huyền',
    picture:
      'https://platform-lookaside.fbsbx.com/platform/profilepic/?eai=AXFb3zpQbDkPwFU1n4XyV6nC_y8tD_ClKCGTiSGn4RRx10Y-Aeu1ZGXvI4ZTdlCtnXTEZTONTARW&psid=24435616059360996&width=300&ext=1752807609&hash=AT8VRCfpFZZMkZB4ygq4QPKk',
    gender: 'other',
    phone: '0987987987',
    email: null,
    address:
      '123, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội, Phường Bắc Sơn, Thành phố Sầm Sơn, Tỉnh Thanh Hóa',
    street: '123, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',
    ward: 'Phường Bắc Sơn',
    wardCode: '14833',
    district: 'Thành phố Sầm Sơn',
    districtCode: '382',
    province: 'Tỉnh Thanh Hóa',
    provinceCode: '38',
    shoppe: null,
    facebook: null,
    zalo: null,
  },
  teams: [
    {
      roleId: '68468d8edd73180012113f95',
      roleIcon: 'fa-solid fa-plus',
      roleName: 'Creator',
      userId: '65e153749aa2455d7f92ecc1',
      userName: 'TrangDT',
      userPicture:
        'https://s3.smax.in/users/1709266277761-65e153749aa2455d7f92ecc1.jpg',
      userEmail: 'trangxinhngoanyeu@viktech.com',
    },
    {
      roleId: '68468d8edd73180012113f96',
      roleIcon: 'fa-solid fa-phone',
      roleName: 'Telesale',
      userId: '664db4aae07ab14dea105311',
      userName: 'sale5',
      userPicture:
        'https://gravatar.com/avatar/f0a0432f5cf72435e69c5b1318208184?d=identicon',
      userEmail: 'sale5@gmail.com',
    },
    {
      roleId: '68468d8edd73180012113f98',
      roleIcon: 'fa-solid fa-warehouse',
      roleName: 'Warehouse',
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    },
    {
      roleId: '68468d8edd73180012113f97',
      roleIcon: 'fa-solid fa-bullhorn',
      roleName: 'Marketing',
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    },
    {
      roleId: '6855327c60ecf60014c412c7',
      roleIcon: 'fa-solid fa-circle-user',
      roleName: 'CSKH',
      userId: '664db4aae07ab14dea105311',
      userName: 'sale5',
      userPicture:
        'https://gravatar.com/avatar/f0a0432f5cf72435e69c5b1318208184?d=identicon',
      userEmail: 'sale5@gmail.com',
    },
  ],
  cart: {
    products: null,
    courseEvents: null,
    beautyServices: null,
    warehouses: null,
    prepaidCards: null,
    combos: null,
  },
  orderIds: [],
  orderCodes: [],
  tags: ['685e07ba8c8bd0d4f95b9e6c'],
  tagNames: [],
  sourceId: null,
  platformSourceIds: ['6846ae4cff014aa196a0c5cc', 'FACEBOOK'],
  platformSources: [
    {
      id: '6846ae4cff014aa196a0c5cc',
      name: 'Fb (mức ưu tiên 2)',
      platform: 'FACEBOOK',
      picture:
        'https://dev-cdn.smax.in/s01/smaxapp-dev/bizs/68468d8edd73180012113f92/auto-task/1750921239152-3r4rl8.jpeg?expire=1782457239199&signature=c1c99201a2cbfc939562b1e3f09b6e17eba863be797b274958ec90cd1c03ca16',
      platformId: '109578068557264',
    },
    {
      id: 'FACEBOOK',
      name: 'Facebook',
      platform: 'FACEBOOK',
      picture: './assets/images/platform_facebook.png',
      platformId: 'FACEBOOK',
    },
  ],
  createdAt: '2025-06-25T04:11:22.096Z',
  updatedAt: '2025-07-01T03:15:04.185Z',
  code: 'TV0782',
  taskDistributionConfigId: '684799aeff014aa196a0cc53',
  hasTaskChains: true,
  updatedBy: {
    id: '66f51c829045fcf1c1753e51',
    name: 'Doanh Nguyễn Quốc',
    picture:
      'https://lh3.googleusercontent.com/a/ACg8ocIovt9HsBJoQC9h0dnbY2IkKpo5--c_pRGpdYj6zrdUnMuEPg=s96-c',
    email: 'nqdcntt2002@gmail.com',
  },
  taskDistributionConfig: '684799aeff014aa196a0cc53',
  taskChains: [
    {
      bizId: '68468d8edd73180012113f92',
      name: 'Gọi mời qua SHR',
      status: 'ACTIVE',
      taskId: '685b76ea8c8bd0d4f95b950f',
      chainActId: '6846956a3e7afc6bf4cd635e',
      createdAt: '2025-06-25T04:11:22.181Z',
      updatedAt: '2025-06-25T04:11:22.181Z',
      task: '685b76ea8c8bd0d4f95b950f',
      taskChainResults: [
        {
          createdBy: {
            id: '65e153749aa2455d7f92ecc1',
            name: 'TrangDT',
            picture:
              'https://s3.smax.in/users/1709266277761-65e153749aa2455d7f92ecc1.jpg',
            email: 'trangxinhngoanyeu@viktech.com',
          },
          bizId: '68468d8edd73180012113f92',
          taskChainId: '685b76ea8c8bd0d4f95b9520',
          taskId: '685b76ea8c8bd0d4f95b950f',
          status: 'COMPLETED',
          action: {
            createdBy: {
              id: '65e142259aa2455d7f92e6c8',
              name: 'atmosphere.ttt',
              picture:
                'https://s3.smax.in/users/1709622448268-65e142259aa2455d7f92e6c8.jpg',
              email: 'atmosphere.ttt@gmail.com',
            },
            bizId: '68468d8edd73180012113f92',
            name: 'Gọi lần 1 ',
            type: 'CALL',
            reasonIds: [],
            callBlockAutomation: null,
            templateId: null,
            createdAt: '2025-06-09T07:43:03.524Z',
            updatedAt: '2025-06-09T07:43:03.524Z',
            reasons: [],
            id: '68469087d51cb88467c2def8',
          },
          type: 1,
          deadlineDate: '2100-01-01T00:00:00.000Z',
          feedbacks: [],
          orders: [],
          bookings: [],
          results: [
            {
              nextActions: [
                {
                  delayType: 0,
                  type: 0,
                  nextAction: 'CLOSE_CHAIN',
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách hẹn qua SHR',
                id: '684695583e7afc6bf4cd6354',
              },
            },
            {
              nextActions: [
                {
                  delayType: 0,
                  type: 0,
                  nextAction: 'CLOSE_CHAIN',
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách từ chối không quan tâm',
                id: '68468f5cd51cb88467c2decc',
              },
            },
            {
              nextActions: [
                {
                  delayType: 3,
                  delayValue: 1,
                  type: 0,
                  nextAction: 'CONTINUE_TO_NEXT_ACTION',
                  moveToAction: {
                    chainActResultId: '6846956a17553711f867cdba',
                    chainActResult: {
                      action: {
                        name: 'Gọi lần 2 ',
                        id: '68469090d51cb88467c2defb',
                      },
                      id: '6846956a17553711f867cdba',
                    },
                  },
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách đang đắn đo',
                id: '68468f38d51cb88467c2dec4',
              },
            },
          ],
          errors: [],
          subActions: [
            {
              createdBy: {
                id: '65e153749aa2455d7f92ecc1',
                name: 'TrangDT',
                picture:
                  'https://s3.smax.in/users/1709266277761-65e153749aa2455d7f92ecc1.jpg',
                email: 'trangxinhngoanyeu@viktech.com',
              },
              bizId: '68468d8edd73180012113f92',
              name: 'Tạo Booking',
              type: 'BOOKING',
              reasonIds: ['68468fa13e7afc6bf4cd6278'],
              callBlockAutomation: null,
              templateId: null,
              createdAt: '2025-06-13T07:53:24.641Z',
              updatedAt: '2025-06-13T07:53:24.641Z',
              reasons: ['68468fa13e7afc6bf4cd6278'],
              id: '684bd8f430ec13c82a663022',
            },
          ],
          reasonEditedDate: [],
          createdAt: '2025-06-25T04:11:22.200Z',
          updatedAt: '2025-07-01T03:15:02.732Z',
          executedDate: '2025-07-01T03:15:02.731Z',
          note: null,
          result: {
            name: 'Khách đang đắn đo',
            id: '68468f38d51cb88467c2dec4',
          },
          updatedBy: {
            id: '66f51c829045fcf1c1753e51',
            name: 'Doanh Nguyễn Quốc',
            picture:
              'https://lh3.googleusercontent.com/a/ACg8ocIovt9HsBJoQC9h0dnbY2IkKpo5--c_pRGpdYj6zrdUnMuEPg=s96-c',
            email: 'nqdcntt2002@gmail.com',
          },
          taskChain: '685b76ea8c8bd0d4f95b9520',
          task: '685b76ea8c8bd0d4f95b950f',
          nextActions: [
            {
              createdBy: {
                id: '66f51c829045fcf1c1753e51',
                name: 'Doanh Nguyễn Quốc',
                picture:
                  'https://lh3.googleusercontent.com/a/ACg8ocIovt9HsBJoQC9h0dnbY2IkKpo5--c_pRGpdYj6zrdUnMuEPg=s96-c',
                email: 'nqdcntt2002@gmail.com',
              },
              bizId: '68468d8edd73180012113f92',
              taskChainId: '685b76ea8c8bd0d4f95b9520',
              taskId: '685b76ea8c8bd0d4f95b950f',
              status: 'ACTIVE',
              action: {
                createdBy: {
                  id: '65e142259aa2455d7f92e6c8',
                  name: 'atmosphere.ttt',
                  picture:
                    'https://s3.smax.in/users/1709622448268-65e142259aa2455d7f92e6c8.jpg',
                  email: 'atmosphere.ttt@gmail.com',
                },
                bizId: '68468d8edd73180012113f92',
                name: 'Gọi lần 2 ',
                type: 'CALL',
                reasonIds: [],
                callBlockAutomation: null,
                templateId: null,
                createdAt: '2025-06-09T07:43:12.835Z',
                updatedAt: '2025-06-09T07:43:12.835Z',
                reasons: [],
                id: '68469090d51cb88467c2defb',
              },
              type: 1,
              deadlineDate: '2025-07-02T03:15:02.696Z',
              childNextAction: {
                addNewChain: null,
                callBlockAutomation: null,
                closeCloneTask: null,
                delayType: 3,
                delayValue: 1,
                moveToAction: {
                  chainActResultId: '6846956a17553711f867cdba',
                  chainActResult: {
                    id: '6846956a17553711f867cdba',
                    action: {
                      name: 'Gọi lần 2 ',
                      id: '68469090d51cb88467c2defb',
                    },
                  },
                },
                nextAction: 'CONTINUE_TO_NEXT_ACTION',
                type: 0,
              },
              feedbacks: [],
              orders: [],
              bookings: [],
              results: [
                {
                  nextActions: [
                    {
                      delayType: 0,
                      type: 0,
                      nextAction: 'CLOSE_CHAIN',
                      closeCloneTask: [],
                    },
                  ],
                  result: {
                    name: 'Khách hẹn qua SHR',
                    id: '684695583e7afc6bf4cd6354',
                  },
                },
                {
                  nextActions: [
                    {
                      delayType: 0,
                      type: 0,
                      nextAction: 'CLOSE_CHAIN',
                      closeCloneTask: [],
                    },
                  ],
                  result: {
                    name: 'Khách từ chối không quan tâm',
                    id: '68468f5cd51cb88467c2decc',
                  },
                },
                {
                  nextActions: [
                    {
                      delayType: 3,
                      delayValue: 1,
                      type: 0,
                      nextAction: 'CONTINUE_TO_NEXT_ACTION',
                      moveToAction: {
                        chainActResultId: '6846956a17553711f867cdbc',
                        chainActResult: {
                          action: {
                            name: 'Gọi lần 3 ',
                            id: '68469096d51cb88467c2defe',
                          },
                          id: '6846956a17553711f867cdbc',
                        },
                      },
                      closeCloneTask: [],
                    },
                  ],
                  result: {
                    name: 'Khách đang đắn đo',
                    id: '68468f38d51cb88467c2dec4',
                  },
                },
              ],
              nextActionIds: [],
              errors: [],
              subActions: [],
              reasonEditedDate: [],
              createdAt: '2025-07-01T03:15:02.716Z',
              updatedAt: '2025-07-01T03:15:02.716Z',
              taskChain: '685b76ea8c8bd0d4f95b9520',
              task: '685b76ea8c8bd0d4f95b950f',
              nextActions: [],
              id: '686352b6a35704a496c0bce3',
            },
          ],
          id: '685b76ea8c8bd0d4f95b9522',
        },
        {
          createdBy: {
            id: '66f51c829045fcf1c1753e51',
            name: 'Doanh Nguyễn Quốc',
            picture:
              'https://lh3.googleusercontent.com/a/ACg8ocIovt9HsBJoQC9h0dnbY2IkKpo5--c_pRGpdYj6zrdUnMuEPg=s96-c',
            email: 'nqdcntt2002@gmail.com',
          },
          bizId: '68468d8edd73180012113f92',
          taskChainId: '685b76ea8c8bd0d4f95b9520',
          taskId: '685b76ea8c8bd0d4f95b950f',
          status: 'ACTIVE',
          action: {
            createdBy: {
              id: '65e142259aa2455d7f92e6c8',
              name: 'atmosphere.ttt',
              picture:
                'https://s3.smax.in/users/1709622448268-65e142259aa2455d7f92e6c8.jpg',
              email: 'atmosphere.ttt@gmail.com',
            },
            bizId: '68468d8edd73180012113f92',
            name: 'Gọi lần 2 ',
            type: 'CALL',
            reasonIds: [],
            callBlockAutomation: null,
            templateId: null,
            createdAt: '2025-06-09T07:43:12.835Z',
            updatedAt: '2025-06-09T07:43:12.835Z',
            reasons: [],
            id: '68469090d51cb88467c2defb',
          },
          type: 1,
          deadlineDate: '2025-07-02T03:15:02.696Z',
          childNextAction: {
            addNewChain: null,
            callBlockAutomation: null,
            closeCloneTask: null,
            delayType: 3,
            delayValue: 1,
            moveToAction: {
              chainActResultId: '6846956a17553711f867cdba',
              chainActResult: {
                id: '6846956a17553711f867cdba',
                action: {
                  name: 'Gọi lần 2 ',
                  id: '68469090d51cb88467c2defb',
                },
              },
            },
            nextAction: 'CONTINUE_TO_NEXT_ACTION',
            type: 0,
          },
          feedbacks: [],
          orders: [],
          bookings: [],
          results: [
            {
              nextActions: [
                {
                  delayType: 0,
                  type: 0,
                  nextAction: 'CLOSE_CHAIN',
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách hẹn qua SHR',
                id: '684695583e7afc6bf4cd6354',
              },
            },
            {
              nextActions: [
                {
                  delayType: 0,
                  type: 0,
                  nextAction: 'CLOSE_CHAIN',
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách từ chối không quan tâm',
                id: '68468f5cd51cb88467c2decc',
              },
            },
            {
              nextActions: [
                {
                  delayType: 3,
                  delayValue: 1,
                  type: 0,
                  nextAction: 'CONTINUE_TO_NEXT_ACTION',
                  moveToAction: {
                    chainActResultId: '6846956a17553711f867cdbc',
                    chainActResult: {
                      action: {
                        name: 'Gọi lần 3 ',
                        id: '68469096d51cb88467c2defe',
                      },
                      id: '6846956a17553711f867cdbc',
                    },
                  },
                  closeCloneTask: [],
                },
              ],
              result: {
                name: 'Khách đang đắn đo',
                id: '68468f38d51cb88467c2dec4',
              },
            },
          ],
          nextActionIds: [],
          errors: [],
          subActions: [],
          reasonEditedDate: [],
          createdAt: '2025-07-01T03:15:02.716Z',
          updatedAt: '2025-07-01T03:15:02.716Z',
          taskChain: '685b76ea8c8bd0d4f95b9520',
          task: '685b76ea8c8bd0d4f95b950f',
          nextActions: [],
          id: '686352b6a35704a496c0bce3',
        },
      ],
      id: '685b76ea8c8bd0d4f95b9520',
    },
  ],
  id: '685b76ea8c8bd0d4f95b950f',
};

console.log(checkTaskFilter(task)); // Should return true or false based on the filter conditions
