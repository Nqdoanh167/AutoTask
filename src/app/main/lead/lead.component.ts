import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {EModule, ELeadTab} from '@app/types/viewmodels';

@Component({
  selector: 'app-lead',
  templateUrl: './lead.component.html',
  styleUrls: ['./lead.component.scss'],
})
export class LeadComponent {
  EModule = EModule;
  ELeadTab = ELeadTab;

  constructor(private router: Router) {}

  isActiveRoute(tab: string): boolean {
    return this.router.url.includes(`/${EModule.LEAD}/${tab}`);
  }
}
