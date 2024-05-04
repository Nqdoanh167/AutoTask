import {Component, ContentChild, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'custom-select-input-search',
  templateUrl: './custom-select-input-search.component.html',
  styleUrls: ['./custom-select-input-search.component.scss'],
  standalone: true,
  imports: [CommonModule, NgSelectModule, ReactiveFormsModule],
})
export class CustomSelectInputSearchComponent implements OnInit {
  @ContentChild('labelTemp') labelTemp!: any;
  @Input() placeHolder = '';
  @Input() options: any[] = [];
  @Input() id = '';
  @Input() labelForId = '';
  @Input() formControlName = '';

  constructor() {}

  ngOnInit(): void {
    console.log('labelTemp', this.labelTemp);
  }

  onChange($event: any) {}

  onSearch($event: {term: string; items: any[]}) {}
}
