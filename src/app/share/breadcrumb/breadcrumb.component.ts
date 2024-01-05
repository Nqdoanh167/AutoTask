import { Component, Input, OnInit } from '@angular/core';
@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  name!: string;
  menu: Array<any> = [];
  @Input() breadcrumbList: Array<any> = [];

  constructor() { }
  ngOnInit() { }
}
