import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {ILead} from '@app/types/lead';
import {LeadDashboardData} from '../lead-dashboard-data';

@Component({
  selector: 'app-lead-update-modal',
  templateUrl: './lead-update-modal.component.html',
  styleUrls: ['./lead-update-modal.component.scss'],
})
export class LeadUpdateModalComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Output() saveEvent = new EventEmitter<ILead>();
}
