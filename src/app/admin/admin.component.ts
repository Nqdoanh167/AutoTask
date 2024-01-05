import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/api/auth.service';
import {User} from '../types/viewmodels';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  user!: User;
  constructor(private authService: AuthService) {
    this.authService.currentUser.subscribe({
      next: (res) => {
        if (res) {
          if (['DEV', 'ADMIN'].includes(res.role)) {
            this.user = res;
          } else {
            window.location.href = 'https://smax.app';
          }
        }
      },
    });
  }

  ngOnInit(): void {}
}
