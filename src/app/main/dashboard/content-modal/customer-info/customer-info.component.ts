import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {
  distinctUntilKeyChanged,
  finalize,
  Subject,
  takeUntil,
  forkJoin,
  of,
} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {EntityPagination, ITag} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CustomerService} from '@app/services/api/customer.service';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';
import {Customer, CustomerTag, IOrderCustomer} from '@app/types/customer';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ToastrService} from 'ngx-toastr';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalUpdateCustomerComponent} from '@main/dashboard/content-modal/modal-update-customer/modal-update-customer.component';
import {RfmService} from '@app/services/api/rfm.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LeadService} from '@app/services/api/lead.service';
import {ILeadStatus} from '@app/types/lead';

type ViewOrderType = 'completed' | 'cancelled' | 'trash';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss'],
})
export class CustomerInfoComponent implements OnDestroy, OnInit, OnChanges {
  @ViewChildren(InputSuggestCustomerComponent)
  inputSuggestCustomers!: QueryList<InputSuggestCustomerComponent>;
  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;
  @Input() hasUpdateTaskPer: boolean = false;
  @Input() selectedCustomerId: string = '';
  @Input() leadId?: string;
  @Input() isOpenBackdrop: boolean = false;
  @Output() isOpenBackdropChange = new EventEmitter<boolean>();

  // Lead-related properties when creating task from lead
  public leadStatuses: any[] = [];
  public leadTags: any[] = [];
  public loadingLeadData = false;

  // Store original values for revert on cancel
  public originalLeadStatusId: string | null = null;
  public originalLeadTags: string[] = [];

  private currentBiz = '';
  private destroy$ = new Subject();

  public listProvince: IProvince[] = [];
  public listDistrict: IDistrict[] = [];
  public listWard: IWard[] = [];
  public trigger = {
    name: false,
  };

  public loading = {
    customer: false,
    updateCustomer: false,
    getInfoRfm: false,
  };
  //Hành vi mua hàng
  public viewBehavior: boolean = true;
  public viewOrderType?: ViewOrderType;
  public viewOrCustomerOrders: IOrderCustomer[] = [];
  public selectedCustomer: Customer | null = null;
  public selectTag: boolean = false;
  public rfmInFo: {
    point?: number;
    groupName?: string;
  } = {
    point: 0,
    groupName: '',
  };

  protected hasPermitCustomer =
    this.authService.checkPermittedModule('customers');

  protected hasPermitRfm = this.authService.checkPermittedModule('rfm');

  public readonly groupRFM: Record<string, string> = {
    champions: 'Champions',
    loyal_customers: 'Loyal Customers',
    potential_loyalist: 'Potential Loyalists',
    recent_customers: 'Recent Customers',
    promising: 'Promising',
    needs_attention: 'Need Attention',
    about_to_sleep: 'About to Sleep',
    at_risk: 'At Risk',
    cannot_lose_them: 'Cannot Lose Them',
    hibernating: 'Hibernating',
    lost: 'Lost',
  };

  constructor(
    private readonly apiLocationService: ApiLocationService,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toarst: ToastrService,
    private readonly modalService: BsModalService,
    private readonly rfmService: RfmService,
    private readonly autoTaskService: AutoTaskService,
    private readonly leadService: LeadService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz.alias || '';
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.formGroup.controls;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.['selectedCustomerId'] &&
      changes?.['selectedCustomerId']?.currentValue
    ) {
      this.rfmInFo = {
        point: 0,
        groupName: '',
      };
    }
  }

  ngOnInit(): void {
    if (!this.hasUpdateTaskPer) {
      this.formGroup.disable();
    }
    this.getProvince();
    if (this.leadId) {
      this.loadLeadStatusesAndTags();
      this.leadService.lead.getById(this.leadId).subscribe((res) => {
        if (res.status === 200) {
          // Store original values for revert
          this.originalLeadStatusId = res.data?.statusId || null;
          this.originalLeadTags = res.data?.tagIds || [];

          this.formGroup.patchValue({
            leadStatusId: res.data?.statusId,
            leadTags: res.data?.tagIds,
          });
        }
      });
    } else {
      this.getCustomerDetail(this.selectedCustomerId, true);
    }
    // Load district và ward nếu form đã có provinceCode và districtCode (từ lead data)
    const provinceCode = this.formGroup.get('provinceCode')?.value;
    const districtCode = this.formGroup.get('districtCode')?.value;

    if (provinceCode) {
      this.getDistrict(provinceCode);
    }

    if (provinceCode && districtCode) {
      this.getWard(provinceCode, districtCode);
    }
  }

  getCustomerDetail(id: string, isInit: boolean = false) {
    if (!this.hasPermitCustomer || !id) return;
    this.loading.customer = true;
    this.customerService.customer
      .getById(id)
      .pipe(
        finalize(() => (this.loading.customer = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            const customer = res.data;
            this.getBehaviorInfoCustomer(customer?.id!);

            // Load district và ward trước khi patch data
            const loadRequests = [];
            if (customer?.provinceCode) {
              loadRequests.push(
                this.apiLocationService.getDistrict({
                  provinceCode: customer.provinceCode,
                  location: 'VN',
                }),
              );
            } else {
              loadRequests.push(of(null));
            }

            if (customer?.provinceCode && customer?.districtCode) {
              loadRequests.push(
                this.apiLocationService.getWard({
                  provinceCode: customer.provinceCode,
                  districtCode: customer.districtCode,
                  location: 'VN',
                }),
              );
            } else {
              loadRequests.push(of(null));
            }

            // Đợi load xong rồi mới patch data
            forkJoin(loadRequests).subscribe({
              next: ([districtRes, wardRes]) => {
                if (districtRes && districtRes.data) {
                  this.listDistrict = districtRes.data;
                }
                if (wardRes && wardRes.data) {
                  this.listWard = wardRes.data as IWard[];
                }

                // Giờ mới patch data vào form
                this.handleChooseCustomer(customer, isInit);
                this.handleViewOrderType('completed');
              },
              error: (err) => {
                // Nếu lỗi vẫn patch data
                this.handleChooseCustomer(customer, isInit);
                this.handleViewOrderType('completed');
              },
            });
          } else {
            console.info('Không tìm thấy khách hàng!', res);
          }
        },
      });
  }

  getBehaviorInfoCustomer(id: string) {
    if (id && this.hasPermitRfm) {
      this.loading.getInfoRfm = true;
      this.rfmService.customerRfm
        .getBehavior(id)
        .pipe(
          finalize(() => {
            this.loading.getInfoRfm = false;
          }),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res && res.status === 200) {
              this.rfmInFo.point = res.data?.rfm || 0;
              this.rfmInFo.groupName = res.data?.groupName || '';
            } else {
            }
          },
        });
    }
  }

  getAverageOrder() {
    // Tính giá trị đơn trung bình theo trạng thái completed
    const orders = this.selectedCustomer?.orders.filter(
      (order) => order.status === 'completed',
    );

    if (!orders || orders.length === 0) return 0;

    const amount = orders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    return amount / orders.length;
  }

  handleViewCustomer(customerId?: string) {
    if (!customerId) return;
    let url = `${environment.urlDomain}/${this.currentBiz}/customers/${customerId}`;
    window.open(url, '_blank');
  }

  handleViewOrder(orderId?: string) {
    if (!orderId) return;
    let url = `${environment.urlDomain}/${this.currentBiz}/sale-center/?code=${orderId}`;
    window.open(url, '_blank');
  }

  compareFunction(item: CustomerTag, selected: any) {
    return item.id === selected.id;
  }

  getProvince() {
    this.apiLocationService
      .getProvince(
        {
          location: 'VN',
        },
        {cache: true},
      )
      .subscribe({
        next: (res) => {
          this.listProvince = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getDistrict(provinceCode: string) {
    this.apiLocationService
      .getDistrict({
        provinceCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listDistrict = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getWard(provinceCode: string, districtCode: string) {
    this.apiLocationService
      .getWard({
        provinceCode,
        districtCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listWard = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleChangeLocation(value: string, type: 'province' | 'district' | 'ward') {
    switch (type) {
      case 'province':
        this.formGroup.patchValue({
          district: null,
          districtCode: null,
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formGroup.patchValue({
            province: null,
            provinceCode: null,
          });
          return;
        }
        this.formGroup.patchValue({
          province: this.listProvince.find((el) => el.provinceCode === value)
            ?.province,
        });
        this.getDistrict(value);
        break;
      case 'district':
        this.formGroup.patchValue({
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formGroup.patchValue({
            district: null,
            districtCode: null,
            ward: null,
            wardCode: null,
          });
          return;
        }
        this.formGroup.patchValue({
          district: this.listDistrict.find((el) => el.districtCode === value)
            ?.district,
        });
        this.getWard(this.formGroup.value.provinceCode, value);
        break;
      case 'ward':
        if (!value) return;
        this.formGroup.patchValue({
          ward: this.listWard.find((el) => el.wardCode === value)?.ward,
        });
        break;
    }
    this.handleCombineAddress();
  }

  handleCombineAddress() {
    const {street, district, ward, province} = this.formGroup.value;
    const addressParts = [street, ward, district, province];
    const address = addressParts.filter((part) => part).join(', ');
    this.formGroup.patchValue({
      address,
    });
  }

  handleChooseCustomer(customer?: Customer, isInit: boolean = false) {
    if (!customer) return;
    this.trigger.name = false;

    const patchData: any = {};
    const formValues = this.formGroup.value;

    const fields: (keyof Customer)[] = [
      'id',
      'name',
      'picture',
      'phone',
      'email',
      'province',
      'provinceCode',
      'district',
      'districtCode',
      'ward',
      'wardCode',
      'tags',
      'address',
      'gender',
      'street',
    ];

    for (const key of fields) {
      patchData[key] = formValues[key];
      const customerValue = customer[key];

      if ((isInit && !patchData[key]) || !isInit) {
        patchData[key] = customerValue;
      }

      if (key === 'provinceCode') {
        // this.getDistrict(patchData[key]);
      }

      if (key === 'districtCode' && patchData[key]) {
        // this.getWard(patchData['provinceCode'], patchData[key]);
      }
    }

    this.formGroup.patchValue(patchData);
    this.selectedCustomer = customer;
  }

  handleClearSelectValue() {
    this.inputSuggestCustomers?.forEach((el) => {
      el.selectedCustomer = undefined;
    });
  }

  updateCustomer() {
    if (!this.hasPermitCustomer) return;
    if (!this.formGroup?.value?.id) {
      this.toarst.warning('Không tìm thấy khách hàng được tham chiếu');
    }
    this.loading.updateCustomer = true;
    const body = {
      ...this.formGroup.value,
      tagIds: this.formGroup?.value?.tags?.map((tag: ITag) => tag.id) || null,
    };
    this.customerService.customer
      .update(this.formGroup.value.id, body)
      .pipe(
        finalize(() => (this.loading.updateCustomer = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.selectedCustomer = res.data;
          this.commonService.handleResSuccess('update');
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  handleSyncCustomer() {
    const title = 'Cập nhật cho bản ghi Khách hàng';
    const description = `Bạn sắp cập nhật ngược thông tin của Khách hàng từ Tác vụ này qua module <b>Khách Hàng</b>, hành động này không thể hoàn tác. 
Tất cả thông tin bạn đã điền trong này, như Tên, thẻ Tag, SĐT, Loại khách hàng và Địa chỉ sẽ được cập nhật vào bản ghi tương ứng trong module <b>Khách Hàng</b>.`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'info',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.updateCustomer();
    });
  }

  handleUpdateCustomer() {
    this.isOpenBackdropChange.emit(true);
    const modalUpdateCustomer = this.modalService.show(
      ModalUpdateCustomerComponent,
      {
        class: 'modal-dialog-centered',
        initialState: {
          dataDetail: this.selectedCustomer!,
        },
      },
    );
    modalUpdateCustomer.content?.updateSuccessEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.selectedCustomer = res;
        modalUpdateCustomer.hide();
      });
    modalUpdateCustomer.onHide?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOpenBackdropChange.emit(false);
    });
  }

  handleClearSelectedCustomer() {
    const title = 'Bỏ chọn khách hàng';
    const description = `Bạn có chắc muốn bỏ tham chiếu khách hàng <b>${
      this.selectedCustomer?.name || ''
    }</b> với module <b>Khách Hàng</b> không?`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.selectedCustomer = null;
      this.formGroup.patchValue({
        id: null,
      });
    });
  }

  onChangeInputSuggestCustomer(value: any) {}

  onChangePhoneCustomer(value: string | undefined) {
    this.formGroup.patchValue({phone: value});
  }

  getCustomerDetailFromPhone(customerId: string) {
    // Xử lý khi chọn khách hàng từ danh sách suggest
    if (customerId) {
      this.getCustomerDetail(customerId);
    }
  }

  handleViewOrderType(type: ViewOrderType) {
    if (!this.viewOrderType || this.viewOrderType !== type) {
      this.viewOrderType = type;
      this.viewOrCustomerOrders =
        this.selectedCustomer?.orders?.filter((order) => {
          return order.status === type;
        }) || [];
    } else {
      this.viewOrderType = undefined;
      this.viewOrCustomerOrders = [];
    }
  }

  loadLeadStatusesAndTags() {
    this.loadingLeadData = true;

    const leadStatuses$ = this.leadService.leadStatus.get();
    const leadTags$ = this.autoTaskService.tag.get({
      applyFor_in: ['LEAD'],
    });

    Promise.all([leadStatuses$.toPromise(), leadTags$.toPromise()])
      .then(([statusesRes, tagsRes]) => {
        if (statusesRes?.status === 200) {
          this.leadStatuses = statusesRes.data || [];
        }

        if (tagsRes?.status === 200) {
          this.leadTags = tagsRes.data || [];
        }

        this.loadingLeadData = false;
      })
      .catch((error) => {
        console.error('Error loading lead statuses and tags:', error);
        this.loadingLeadData = false;
      });
  }

  onLeadStatusChange(status: ILeadStatus) {
    if (!status) return;

    const currentStatus = this.leadStatuses.find(
      (s) => s.id === this.originalLeadStatusId,
    );
    const message = `Bạn đang thay đổi trạng thái lead từ "${
      currentStatus?.name || 'Không có'
    }" thành "${
      status.name
    }". Việc cập nhật sẽ ảnh hưởng tới tất cả các tác vụ khác có lead này.`;
    this.showConfirmModal(
      'Cập nhật trạng thái Lead',
      message,
      () => {
        this.formGroup.patchValue({leadStatusId: status.id});
        this.updateLeadStatus(status.id);
      },
      () => {
        this.formGroup.patchValue({leadStatusId: this.originalLeadStatusId});
      },
    );
  }

  onLeadTagsChange(tags: ITag[]) {
    if (!tags) return;

    const currentTagNames =
      this.originalLeadTags
        .map((tagId: string) => {
          const tag = this.leadTags.find((t) => t.id === tagId);
          return tag?.name || tagId;
        })
        .join(', ') || 'Không có';
    const newTagNames = tags.map((tag) => tag.name).join(', ') || 'Không có';
    const message = `Bạn đang thay đổi tag lead từ "${currentTagNames}" thành "${newTagNames}". Việc cập nhật sẽ ảnh hưởng tới tất cả các tác vụ khác có lead này.`;

    this.showConfirmModal(
      'Cập nhật Tag Lead',
      message,
      () => {
        this.updateLeadTags(tags.map((tag) => tag.id!));
      },
      () => {
        this.formGroup.patchValue({leadTags: this.originalLeadTags});
      },
    );
  }

  private showConfirmModal(
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) {
    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText: 'Tiếp tục',
      cancelText: 'Hủy',
      type: 'warning',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(
      modalContent,
      undefined,
      onConfirm,
      onCancel,
    );
  }

  private updateLeadStatus(statusId: string) {
    const leadId = this.leadId;
    if (!leadId || !statusId) return;

    this.loadingLeadData = true;
    this.leadService.lead
      .update(leadId, {id: leadId, statusId})
      .pipe(
        finalize(() => (this.loadingLeadData = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toarst.success('Cập nhật trạng thái lead thành công');
            this.originalLeadStatusId = statusId;
          } else {
            this.toarst.error('Có lỗi xảy ra khi cập nhật trạng thái lead');
          }
        },
        error: (err) => {
          this.toarst.error('Có lỗi xảy ra khi cập nhật trạng thái lead');
          console.error('Update lead status error:', err);
        },
      });
  }

  private updateLeadTags(tagIds: string[]) {
    const leadId = this.leadId;
    if (!leadId) return;

    this.loadingLeadData = true;
    this.leadService.lead
      .update(leadId, {id: leadId, tagIds})
      .pipe(
        finalize(() => (this.loadingLeadData = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toarst.success('Cập nhật tag lead thành công');
            this.originalLeadTags = tagIds;
          } else {
            this.toarst.error('Có lỗi xảy ra khi cập nhật tag lead');
          }
        },
        error: (err) => {
          this.toarst.error('Có lỗi xảy ra khi cập nhật tag lead');
          console.error('Update lead tags error:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
