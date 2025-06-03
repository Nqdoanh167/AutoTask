import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {catchError, concat, finalize, Subject, tap} from 'rxjs';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {Biz} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ISetting} from '@app/types/setting';
import {Router} from '@angular/router';
import {ETypeBulkUpdate} from '@app/types/common';
import {ProgressbarType} from 'ngx-bootstrap/progressbar';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-modal-assign-team',
  templateUrl: './modal-assign-team.component.html',
  styleUrls: ['./modal-assign-team.component.scss'],
})
export class ModalAssignTeamComponent implements OnInit, OnDestroy {
  @Input() action!: ETypeBulkUpdate;
  @Input() taskIds!: string[];
  @Output() assignTeams = new EventEmitter();
  private destroy$ = new Subject();
  public ETypeBulkUpdate = ETypeBulkUpdate;
  public biz!: Biz;
  public form!: FormGroup;

  public progressStatus: string | 'progressing' | 'success' | 'error' = '';
  public progressValue = 0;
  public progressMax = 100;
  public progressType: ProgressbarType = 'info';
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly router: Router,
    private readonly toastrService: ToastrService,
  ) {}

  get formTeams(): FormArray {
    return this.form.get('teams') as FormArray;
  }
  ngOnInit(): void {
    this.authService.currentBiz.subscribe((biz) => {
      this.biz = biz;
    });
    this.initForm();
    this.getAutoTaskSettingCache();
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
  getAutoTaskSettingCache() {
    return this.autoTaskService.currentSetting.subscribe({
      next: (res) => {
        if (res) {
          this.patchForm(res);
        }
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
      this.bulkUpdateWithProgress(this.taskIds, value.teams).subscribe({
        next: () => {
            if (this.action === ETypeBulkUpdate.ASSIGN_TEAM) {
              this.toastrService.success('Gán nhân viên phụ trách thành công');
            } else if (this.action === ETypeBulkUpdate.REMOVE_TEAM) {
              this.toastrService.success('Xóa nhân viên phụ trách thành công');
            }
            this.assignTeams.emit();
        },
      });
    }
  }
  hideModal(): void {
    this.modalRef.hide();
  }

  private bulkUpdateWithProgress(
    taskIds: string[],
    teams: any[],
    chunkSize = 20,
  ) {
    const chunks = this.chunkArray(taskIds, chunkSize);
    const totalChunks = chunks.length;
    const increment = 100 / totalChunks;

    this.progressStatus = 'processing';
    this.progressValue = 0;
    this.progressMax = 100;

    return concat(
      ...chunks.map((chunk) =>
        this.autoTaskService.task
          .bulkUpdate({taskIds: chunk, teams})
          .pipe(
            tap(
              () =>
                (this.progressValue = Math.min(
                  this.progressValue + increment,
                  100,
                )),
            ),
          ),
      ),
    ).pipe(
      finalize(() => {
        if (this.progressStatus !== 'error') {
          this.progressValue = 100;
          setTimeout(() => {
            this.progressStatus = 'success';
          }, 100);
        }
      }),
      catchError((err) => {
        this.progressStatus = 'error';
        this.commonService.handleErr(err);
        return err;
      }),
    );
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
