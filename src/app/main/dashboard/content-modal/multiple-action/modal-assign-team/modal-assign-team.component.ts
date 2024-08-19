import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {Biz} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ISetting} from '@app/types/setting';
import {Router} from '@angular/router';
import {ETypeBulkUpdate} from '@app/types/common';

@Component({
  selector: 'app-modal-assign-team',
  templateUrl: './modal-assign-team.component.html',
  styleUrls: ['./modal-assign-team.component.scss'],
})
export class ModalAssignTeamComponent implements OnInit, OnDestroy {
  @Input() action!: ETypeBulkUpdate;
  @Output() assignTeams = new EventEmitter();
  private destroy$ = new Subject();
  public ETypeBulkUpdate = ETypeBulkUpdate;
  public biz!: Biz;
  public form!: FormGroup;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly router: Router,
  ) {}

  get formTeams(): FormArray {
    return this.form.get('teams') as FormArray;
  }
  ngOnInit(): void {
    this.authService.currentBiz.subscribe((biz) => {
      this.biz = biz;
    });
    this.initForm();
    this.getAutoTaskSetting();
  }
  initForm() {
    this.form = this.fb.group({
      teams: this.fb.array([]),
    });
  }
  patchForm(data: ISetting) {
    if (!data.roles?.length) {
      return;
    }
    data?.roles?.forEach((role) => {
      const fRole = this.biz?.roles?.find((roleBiz) => roleBiz.id === role);
      const teamForm = this.fb.group({
        roleId: fRole?.id,
        roleIcon: fRole?.icon,
        roleName: fRole?.name,
        userId: null,
        userName: null,
        userPicture: null,
        userEmail: null,
        beRemove: false,
      });
      this.formTeams.push(teamForm);
    });
  }
  getAutoTaskSetting() {
    this.autoTaskService.setting.retrieve({bizId: this.biz.id}).subscribe({
      next: (res) => {
        if (res && res.status === 200) {
          this.patchForm(res.data);
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err) => {
        this.commonService.handleErr(err);
      },
    });
  }
  onClearTeam(index: number) {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }
  onChangeTeam(index: number, event: any) {
    if (event) {
      this.formTeams.at(index).patchValue({
        userId: event.id,
        userName: event.name,
        userPicture: event.picture,
        userEmail: event.email,
      });
    }
  }
  onRemoveTeam(index: number, event: any) {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
      beRemove: event.target?.checked,
    });
  }
  navigateSetting() {
    this.hideModal();
    this.router.navigate(['/setting/role']);
  }
  onSubmit() {
    if (this.form.valid) {
      const value = this.form.value;
      // remove team without userId
      value.teams = value.teams
        .filter((team: any) => team.userId || team.beRemove)
        .map((team: any) => {
          delete team.beRemove;
          return team;
        });
      this.assignTeams.emit(value);
      this.modalRef.hide();
    }
  }
  hideModal(): void {
    this.modalRef.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
