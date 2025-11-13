import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonModule} from '@angular/common';
import {BaseComponentsComponent} from '@app/share/common/base-components/base-components.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {UserAcl} from '@app/types/setting';
import {finalize} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {TimeViewPipe} from '@app/share/pipe/timeView.pipe';
import {calculateTime} from '@app/utils/common';

@Component({
  selector: 'app-modal-stop-receive',
  templateUrl: './modal-stop-receive.component.html',
  styleUrls: ['./modal-stop-receive.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TimeViewPipe],
})
export class ModalStopReceiveComponent
  extends BaseComponentsComponent
  implements OnInit
{
  @Output() updateSuccess = new EventEmitter<UserAcl>();
  @Input() userAcl!: UserAcl;
  loading = false;

  // Options for stop receiving duration
  stopOptions = [
    {id: '15m', label: 'Trong 15 phút', value: 15},
    {id: '1h', label: 'Trong 1 giờ', value: 60},
    {id: '8h', label: 'Trong 8 giờ', value: 8 * 60},
    {id: '24h', label: 'Trong 24 giờ', value: 24 * 60},
    {id: 'until_restart', label: 'Đến khi tôi bật lại', value: -1},
  ];

  constructor(
    public bsModalRef: BsModalRef,
    private autoTaskService: AutoTaskService,
    private readonly toastr: ToastrService,
  ) {
    super();
  }

  get calculateTimeStopReceive() {
    return calculateTime(this.userAcl.nextReceiveTaskDate, new Date());
  }

  ngOnInit(): void {
    console.log('ModalStopReceiveComponent initialized', this.userAcl);
  }

  onSubmit(): void {
    if (this.loading) return;

    this.loading = true;
    this.autoTaskService.userAcl
      .upsert({
        ...this.userAcl,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.bsModalRef.hide();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastr.success('Cập nhật trạng thái thành công');
            this.updateSuccess.emit(res.data);
          } else {
            this.toastr.error('Cập nhật trạng thái thất bại');
          }
        },
      });
  }
}
