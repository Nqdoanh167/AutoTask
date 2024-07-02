import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ETaskChainType,
  IAddTaskChainDto,
  IChainAct,
  ITask,
  ITaskChain,
  ITaskChainResult,
  ITaskDto,
} from '@app/types/flow';
import {finalize, take, takeUntil} from 'rxjs';
import {FormArray, FormGroup, ValidationErrors} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ESocialPlatform, ITag, User} from '@app/types/viewmodels';
import {intersection} from 'lodash';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';
import {environment} from '../../../../../environments/environment';
import {ModalCallComponent} from '@main/dashboard/content-modal/modal-call/modal-call.component';
import {ToastrService} from 'ngx-toastr';
import {CustomerInfoComponent} from '@main/dashboard/content-modal/customer-info/customer-info.component';
import {ISource, IUpdateSourceDto} from '@app/types/setting';
import {NgSelectComponent} from '@ng-select/ng-select';
import {ETabTaskDetail} from '@app/types/task';
import {MainService} from '@app/services/api/main.service';
import {DetailTaskPerms} from '@main/dashboard/content-modal/modal-update-task/detail-task-perms';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './modal-update-task.component.html',
  styleUrls: ['./modal-update-task.component.scss'],
})
export class ModalUpdateTaskComponent
  extends DetailTaskPerms
  implements OnInit
{
  @ViewChild('templateAddTaskChain') templateAddTaskChain!: TemplateRef<any>;
  public addTaskChainModalRef?: BsModalRef;

  @ViewChild('ngSelectTagTask') ngSelectTagTask!: NgSelectComponent;
  // Call to clear
  @ViewChild(CustomerInfoComponent)
  customerInfoComponent!: CustomerInfoComponent;

  @Input() sourceData?: ITask;
  @Input() taskId?: string;
  @Input() code?: string;
  @Output() updateSuccess = new EventEmitter();

  public selectTag: boolean = false;
  public submittedModal = {
    addTaskChain: false,
  };

  public isOpenBackDrop: boolean = false;
  public listBizUsers: User[] = [];
  public units = this.autoTaskService.getUserUnits(false);

  protected readonly ETabTaskDetail = ETabTaskDetail;
  protected readonly ETaskChainType = ETaskChainType;

  constructor(
    private readonly modalRef: BsModalRef,
    private readonly modalService: BsModalService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toastr: ToastrService,
    private readonly mainService: MainService,
  ) {
    super();
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.updateForm.patchValue({
          counselorId: biz.user?.id,
        } as any);
        this.listBizUsers = biz.users;
        this.currentBiz = biz;
      });
  }

  ngOnInit() {
    this.handleCheckPermission();
    if (this.sourceData) {
      this.patchForm(this.sourceData);
    }
    if (this.code) {
      this.getTaskByCode();
    } else {
      this.getDetailTask();
    }
    this.getBlock();
  }

  getDetailTask(isRefresh = false) {
    if (!this.sourceData?.id && !this.taskId) return;
    this.loading.getDetail = true;
    this.autoTaskService.task
      .getOne(this.sourceData?.id ?? this.taskId!)
      .pipe(finalize(() => (this.loading.getDetail = false)))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sourceData = res.data;
            if (res.data.orderIds?.length > 0) {
              this.getOrderDetail(res.data.orderIds);
            }
            this.patchForm(res.data);
            if (isRefresh) {
              this.customerInfoComponent.handleClearSelectValue();
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getTaskByCode() {
    this.loading.getDetail = true;
    this.autoTaskService.task
      .get({filter: JSON.stringify({codeIn: [this.code]})})
      .pipe(finalize(() => (this.loading.getDetail = false)))
      .subscribe({
        next: (res) => {
          const detailTask = res?.data?.[0];
          if (res.status === 200 && detailTask) {
            this.sourceData = detailTask;
            if (detailTask.orderIds?.length > 0) {
              this.getOrderDetail(detailTask.orderIds);
            }
            this.patchForm(detailTask);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  onChooseTeam(index: number, user: User) {
    this.formTeams.at(index).patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  onRemoveTeam(index: number) {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }

  changeSelectTag(action: boolean) {
    this.selectTag = action;
    if (this.sourceData?.id) {
      this.updateForm.patchValue({
        tags:
          (this.tags.rows
            .filter((tag) => this.sourceData?.tags?.includes(tag.id as any))
            ?.map((tag) => tag.id) as any) || null,
      });
    }
  }

  createNewTagAndChoose(tagName: string) {
    const body: ITag = {
      name: tagName,
      bgColor: '#000000',
    };
    this.autoTaskService.tag
      .create(body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getTag();
            this.ngSelectTagTask.filter('');
            const formTag: string[] = this.updateForm.value.tags || [];
            formTag.push(res.data.id as any);
            this.updateForm.patchValue({
              tags: formTag as any,
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleCreateSourceForm(): Promise<ISource | null> {
    return new Promise((resolve, reject) => {
      this.autoTaskService.source
        .create(this.updateForm.value.sourceForm as unknown as IUpdateSourceDto)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.getSource();
              resolve(res.data);
            } else {
              this.commonService.handleResErr(res);
              reject(res);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
            reject(err);
          },
        });
    });
  }

  async handleUpdate() {
    const branchForm = this.f['branch'].value;
    const sourceForm = this.f['sourceForm'].value;
    if (sourceForm) {
      const newSource = await this.handleCreateSourceForm();
      if (newSource) {
        this.updateForm.patchValue({
          sourceId: newSource.id,
          sourceForm: null,
        } as any);
      } else {
        return;
      }
    }
    return new Promise((resolve, reject) => {
      this.loading.submit = true;
      const body = {
        ...this.updateForm.value,
        branch: !!branchForm
          ? {
              unit: branchForm?.level,
              id: branchForm?.id,
              name: branchForm?.name,
              department: branchForm?.department,
              departmentName: branchForm?.departmentName,
              team: branchForm?.team,
              teamName: branchForm?.teamName,
            }
          : null,
      } as unknown as ITaskDto as any;
      if (this.sourceData?.id) {
        delete body.addChainActIds;
        this.autoTaskService.task
          .update(this.sourceData.id, body)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.loading.submit = false)),
          )
          .subscribe({
            next: (res) => {
              if (res.status === 200) {
                this.commonService.handleResSuccess('update');
                this.updateSuccess.emit();
                resolve(res.data);
                this.getDetailTask();
              } else {
                reject(res);
                if (res.subStatus === 'CUSTOMER.DATA_ERROR') {
                  (res.data as any as Array<any>)?.map((err: any) => {
                    if (err?.response?.subStatus === 'CUSTOMER.ADD_LIMIT') {
                      this.toastr.error(
                        'Số lượng Khách hàng đã đạt giới hạn của gói cước. Không thể tạo thêm bản ghi mới.',
                      );
                    } else {
                      this.commonService.handleResErr(res);
                    }
                  });
                } else {
                  this.commonService.handleResErr(res);
                }
              }
            },
            error: (err) => {
              reject(err);
              this.commonService.handleErr(err);
            },
          });
      } else {
        delete body.taskChains;
        this.autoTaskService.task
          .create(body)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.loading.submit = false)),
          )
          .subscribe({
            next: (res) => {
              if (res.status === 200) {
                this.commonService.handleResSuccess('create');
                this.updateSuccess.emit();
                this.sourceData = res.data;
                this.patchForm(res.data);
                resolve(res.data);
                this.getDetailTask();
              } else {
                reject(res);
                if (res.subStatus === 'CUSTOMER.DATA_ERROR') {
                  (res.data as any as Array<any>)?.map((err: any) => {
                    if (err?.response?.subStatus === 'CUSTOMER.ADD_LIMIT') {
                      this.toastr.error(
                        'Số lượng Khách hàng đã đạt giới hạn của gói cước. Không thể tạo thêm bản ghi mới.',
                      );
                    } else {
                      this.commonService.handleResErr(res);
                    }
                  });
                } else {
                  this.commonService.handleResErr(res);
                }
              }
            },
            error: (err) => {
              reject(err);
              this.commonService.handleErr(err);
            },
          });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    } else {
      this.toastr.warning('Vui lòng điền đầy đủ thông tin');
    }
  }

  // Get form errors
  getFormErrors(formGroup: FormGroup | FormArray): {[key: string]: any} {
    let errors: {[key: string]: any} = {}; // Add index signature to errors object
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        errors[key] = this.getFormErrors(control);
      } else {
        const controlErrors: ValidationErrors | null = control?.errors ?? null;
        if (controlErrors != null) {
          errors[key] = controlErrors;
        }
      }
    });
    return errors;
  }

  handleDeleteTask() {
    const title = 'Xóa Task';
    const description = `Bạn sắp xóa task <b>${
      this.sourceData?.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: this.sourceData,
      errorState:
        'Cẩn trọng với thao tác xóa Task. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteTask(this.sourceData!);
    });
  }

  onDeleteTask(value: ITask) {
    if (!value?.id) return;
    this.loading.deleteTask = true;
    this.autoTaskService.task.delete(value.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess('delete');
          this.updateSuccess.emit();
          this.hideModal();
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err) => this.commonService.handleErr(err),
    });
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleAddTaskChain() {
    this.isOpenBackDrop = true;
    this.addTaskChainModalRef = this.modalService.show(
      this.templateAddTaskChain,
      {
        class: 'modal-dialog-centered modal-add-chain',
      },
    );
    this.addTaskChainModalRef?.onHide?.pipe().subscribe(() => {
      this.isOpenBackDrop = false;
      this.submittedModal.addTaskChain = false;
      this.addTaskChainForm.patchValue({
        addChainActIds: null,
      });
    });
  }

  onAddTaskChain() {
    this.submittedModal.addTaskChain = true;
    if (this.addTaskChainForm.invalid) return;
    if (this.sourceData?.id) {
      const body = {
        addChainActIds: (this.addTaskChainForm.value?.addChainActIds ||
          []) as unknown as string[],
      } as unknown as IAddTaskChainDto;

      this.loading.addTaskChain = true;
      this.autoTaskService.task
        .updateTaskChain(this.sourceData.id!, body)
        .pipe(finalize(() => (this.loading.addTaskChain = false)))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.getDetailTask();
              this.updateSuccess.emit();
              this.addTaskChainModalRef?.hide();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
          },
        });
    } else {
      const newAddChainActIds =
        this.addTaskChainForm.value?.addChainActIds || [];
      const oldAddChainActIds = this.updateForm.value?.addChainActIds || [];
      if (intersection(newAddChainActIds, oldAddChainActIds)?.length > 0) {
        this.toastr.warning('Chuỗi hành động đã tồn tại, vui lòng chọn lại!');
        return;
      }
      this.updateForm.patchValue({
        addChainActIds: [...oldAddChainActIds, ...newAddChainActIds],
      } as any);
      newAddChainActIds.forEach((chainActId) => {
        const taskChainForm = this.fb.group({
          chainActId: chainActId,
          status: 'open',
          taskChainResults: this.fb.array([]),
          name:
            this.actionChains.rows.find((chain) => chain.id === chainActId)
              ?.name || '-',
        });
        this.formTaskChains.push(taskChainForm);
      });
      this.addTaskChainModalRef?.hide();
    }
  }

  handleCloseChain(event: any, taskChain: ITaskChain) {
    event.preventDefault();
    event.stopPropagation();
    const title = 'Đóng chuỗi';
    const description = `Bạn sắp đóng chuỗi <b>${
      taskChain.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xác nhận';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: taskChain,
      errorState:
        'Cẩn trọng với thao tác xóa chuỗi. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onCloseChain(taskChain);
    });
  }

  onCloseChain(value: ITaskChain) {
    this.autoTaskService.taskChain
      .closeChain(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleDeleteChain(event: any, taskChain: ITaskChain, chainIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    if (this.sourceData?.id) {
      const title = 'Xóa chuỗi';
      const description = `Bạn sắp xóa chuỗi <b>${
        taskChain.name || ''
      }</b>, hành động này không thể hoàn tác.`;
      const okText = 'Xác nhận';

      const modalContent: IModalConfirmContent = {
        title,
        description,
        okText,
        type: 'warning',
        modalType: 'advance',
        context: taskChain,
        errorState:
          'Cẩn trọng với thao tác đóng chuỗi. Các module khác đang sử dụng dữ liệu\n' +
          '      của bản ghi cũng sẽ bị ảnh hưởng.',
      };
      this.modalConfirmService.openModal(modalContent, undefined, () => {
        this.onDeleteChain(taskChain);
      });
    } else {
      const addChainActIds = this.updateForm.value?.addChainActIds || [];
      this.formTaskChains.removeAt(chainIndex);
      this.updateForm.patchValue({
        addChainActIds: addChainActIds.filter(
          (id: string) => id !== taskChain.chainActId,
        ),
      } as any);
    }
  }

  onDeleteChain(value: ITaskChain) {
    this.autoTaskService.taskChain
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdateNextStep(
    value: {
      taskChainResultIndex: number;
      nextStepIndex?: number;
      value?: ITaskChainResult;
    },
    taskChain: any,
    chainIndex: number,
  ) {
    this.isOpenBackDrop = true;
    const actionOfChain =
      taskChain?.taskChainResults?.[value.taskChainResultIndex]?.action;
    const actionData = value?.value?.childNextAction;
    const chainActId = taskChain.chainActId;
    const modalUpdateNextStep = this.modalService.show(
      UpdateActionInTaskChainComponent,
      {
        initialState: {
          actionOfChain,
          sourceData: actionData,
          results: this.results.rows,
          blocks: this.blocks.rows,
          actionChains: this.actionChains.rows.map((chain) => {
            return {
              ...chain,
              actionResults: chain.actionResults?.map((actResult) => {
                return {
                  ...actResult,
                  chainAct: {
                    id: chain.id,
                    name: chain.name,
                  },
                  action: {
                    ...actResult.action,
                  },
                };
              }),
            };
          }) as unknown as IChainAct[],
          chainActId,
          loadingData: {
            results: this.results.loading,
            blocks: this.blocks.loading,
            actionChains: this.actionChains.loading,
          },
        },
        class: 'modal-dialog-centered modal-update-next-step',
      },
    );
    modalUpdateNextStep.onHide
      ?.pipe()
      .subscribe(() => (this.isOpenBackDrop = false));
    modalUpdateNextStep.content?.updateSuccess
      .pipe()
      .subscribe((dataStepForm) => {
        try {
          if (value) {
            const formSteps = this.formNextSteps(
              chainIndex,
              value.taskChainResultIndex,
            );
            if (value.nextStepIndex !== undefined && value.nextStepIndex >= 0) {
              formSteps.at(value.nextStepIndex!).patchValue({
                ...dataStepForm,
                childNextAction: {
                  ...dataStepForm,
                },
              });
            } else {
              formSteps.push(
                this.fb.group({
                  ...dataStepForm,
                  closeCloneTask: [dataStepForm.closeCloneTask],
                  childNextAction: {
                    ...dataStepForm,
                    closeCloneTask: dataStepForm.closeCloneTask,
                  },
                }),
              );
            }
          }
        } catch (e) {
          console.log(e);
        }
      });
    modalUpdateNextStep.content?.deleteEvent.pipe().subscribe(() => {
      if (value) {
        const formSteps = this.formNextSteps(
          chainIndex,
          value.taskChainResultIndex,
        );
        if (value.nextStepIndex !== undefined && value.nextStepIndex >= 0) {
          formSteps.removeAt(value.nextStepIndex!);
        }
      }
    });
  }

  handleViewCreatedOrder() {
    let url = `${environment.urlDomain}/${
      this.currentBiz!.alias
    }/sale-center/?sourceId=${this.sourceData?.id}`;
    window.open(url, '_blank');
  }

  async handleCreateTaskOrder() {
    if (!this.sourceData?.id) return;
    try {
      this.submitted = true;
      if (this.updateForm.invalid) return;
      await this.handleUpdate();
    } catch (e) {
      console.log(e);
      return;
    }
    this.loading.createOrder = true;
    this.autoTaskService.task.createOrder(this.sourceData?.id!).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess(
            undefined,
            'Tạo đơn hàng thành công',
          );
          this.updateSuccess.emit();
          this.getDetailTask();
        } else {
          if (res.data as any) {
            res.data?.forEach((err: any) => {
              if (err.response) {
                this.toastr.error(err.response.message);
                return;
              }
            });
          } else {
            this.commonService.handleResErr(res);
          }
        }
      },
      error: (err) => {
        this.commonService.handleErr(err);
      },
    });
  }

  handleCall() {
    try {
      const {phone} = this.formLeadDeal.value;
      if (!phone) {
        this.toastr.warning('Không có số điện thoại của khách hàng');
        return;
      }
      this.isOpenBackDrop = true;
      const modalCall = this.modalService.show(ModalCallComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          customerPhone: phone,
          task: this.sourceData,
        },
        ignoreBackdropClick: true,
        keyboard: false,
      });
      modalCall.onHide?.pipe().subscribe(() => {
        this.isOpenBackDrop = false;
      });
    } catch (e) {
      console.log(e);
    }
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  handleChangeChatLink() {
    const chatLink = this.updateForm.value?.chatLink;
    if (chatLink) {
      let link = chatLink || '';
      // for
      const regexMessPancake = /(pancake).+\?c_id=([0-5][0-9]*_[0-9]*)/i;
      const regexCommentSmaxAI =
        /(smax\.ai).+(fb?[0-9]*)\?tid=(fb?[0-9]*_fb?[0-9]*)/i;
      const regexMessSmaxAI = /(smax\.ai).+(fb?[0-9]*)\?tid=(fb?[0-9]*)/i;
      const regexURLSmax = /(smax\.ai).+(fb?[0-9]*)/i;

      let pageId: any = null;
      let messId = null;
      let platform = null;
      if (regexURLSmax.test(link)) {
        const matchSmaxAI = regexURLSmax.exec(link);
        pageId = matchSmaxAI?.[2]?.replace(/[^\d]/gim, '');

        if (regexMessSmaxAI.test(link)) {
          const matchMessSmaxAI = regexMessSmaxAI.exec(link);
          pageId = matchMessSmaxAI?.[2]?.replace(/[^\d]/gim, '');
          messId = matchMessSmaxAI?.[3]?.replace(/[^\d]/gim, '');
        }

        if (regexCommentSmaxAI.test(link)) {
          const matchCmtSmaxAI = regexCommentSmaxAI.exec(link);
          let cmt = matchCmtSmaxAI?.[3];
          if (cmt) {
            cmt = cmt.split('_')?.[1];
            messId = cmt?.replace(/[^\d]/gim, '');
          }
        }
        platform = 'SMAXAI';
      }

      if (regexMessPancake.test(link)) {
        const matchCmtPancake = regexMessPancake.exec(link);
        let cmt = matchCmtPancake?.[2]?.split('_');
        if (cmt?.length === 2) {
          pageId = cmt[0].replace(/[^\d]/gim, '');
          messId = cmt[1].replace(/[^\d]/gim, '');
        }
        platform = 'PANCAKE';
      }

      if (pageId) {
        const hasPage = this.sources.rows.find((p) => p.platformId === pageId);
        let platformSource: any = hasPage as ISource;
        if (!hasPage) {
          platformSource = {
            id: pageId,
            name: 'Facebook Page',
            platform: ESocialPlatform.FACEBOOK,
            platformId: pageId,
            picture: `https://graph.facebook.com/${pageId}/picture?width=300&height=300`,
          };
          this.sources.rows.push(platformSource);
          this.updateForm.patchValue({
            sourceForm: platformSource,
          });
        } else {
          this.updateForm.patchValue({
            sourceForm: null,
          });
        }

        this.updateForm.patchValue({
          sourceId: platformSource.id,
        });
      }
    }
  }
}
