import {Component, OnInit} from '@angular/core';
import {ModalStopReceiveComponent} from '@app/share/common/modal-stop-receive/modal-stop-receive.component';
import {BsModalService} from 'ngx-bootstrap/modal';
import {AuthService} from 'src/app/services/api/auth.service';
import {BreadcrumbService} from 'src/app/services/common/breadcrumb.service';
import {Biz, User} from 'src/app/types/viewmodels';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  user!: User;
  biz!: Biz;
  breadcrumbList: any = [];
  constructor(
    private authService: AuthService,
    private breadcrumbService: BreadcrumbService,
    private modalService: BsModalService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe({
      next: (res) => {
        if (res) {
          this.user = res;
        }
      },
    });
    this.authService.currentBiz.subscribe({
      next: (res) => {
        if (res) {
          this.biz = res;
        }
      },
    });
    this.breadcrumbService.listBreadcrumb$.subscribe((data) => {
      this.breadcrumbList = data;
    });
  }
  logout() {
    this.authService.logout();
    window.location.href = '/';
  }

  showModalStopReceive() {
    const bsModalRef = this.modalService.show(ModalStopReceiveComponent, {
      class: 'modal-xs',
      ignoreBackdropClick: true,
      backdrop: 'static',
      keyboard: false,
    });
  }
}
