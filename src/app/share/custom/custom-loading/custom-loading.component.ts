import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'custom-loading',
  templateUrl: './custom-loading.component.html',
  styleUrls: ['./custom-loading.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class CustomLoadingComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
