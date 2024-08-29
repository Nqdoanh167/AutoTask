import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Call, ECallStatus} from '@app/types/call';
import {
  EStatusVoice,
  HistoryUpdateDto,
  ManageMappingPhone,
} from '@app/types/sms-ott-call';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {AuthService} from '@app/services/api/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PhoneCallService {
  private incomingCallObj = new BehaviorSubject<Call | null>(null);
  private outgoingCallObj = new BehaviorSubject<Call | null>(null);

  public connectLoading$ = new BehaviorSubject(false);
  public connectedPhone$ = new BehaviorSubject<ManageMappingPhone | undefined>(
    undefined,
  );

  constructor(
    private readonly smsOttCallService: SmsOttCallService,
    private readonly authService: AuthService,
  ) {}

  getIncomingCall() {
    return this.incomingCallObj.asObservable();
  }

  getIncomingCallValue() {
    return this.incomingCallObj.getValue();
  }

  setIncomingCall(incomingCall: Call | null) {
    this.incomingCallObj.next(incomingCall);
  }

  getConnectedPhoneValue() {
    return this.connectedPhone$.getValue();
  }

  updateStatusIncomingCall(status: ECallStatus) {
    const currentCall = this.incomingCallObj.getValue();
    if (currentCall) {
      currentCall.status = status;
      this.incomingCallObj.next(currentCall);
    }
  }

  getOutgoingCall() {
    return this.outgoingCallObj.asObservable();
  }

  setOutgoingCall(outgoingCall: Call | null) {
    this.outgoingCallObj.next(outgoingCall);
  }

  updateStatusOutgoingCall(status?: ECallStatus) {
    const currentCall = this.outgoingCallObj.getValue();
    if (currentCall) {
      currentCall.status = status;
      this.outgoingCallObj.next(currentCall);
    }
    return status;
  }

  clearIncomingCall() {
    this.incomingCallObj.next(null);
  }

  clearOutgoingCall() {
    this.outgoingCallObj.next(null);
  }

  updateHistoricalCallStatus(status: EStatusVoice) {
    const currentCall = this.incomingCallObj.getValue();
    if (!currentCall) {
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    const currentBiz = this.authService.getCurrentBiz();
    const platformId = this.connectedPhone$.getValue()?.platform?.id || '';
    const uniqCode = [currentBiz.id, platformId, currentCall.callId].join('_');
    const body: HistoryUpdateDto = {
      status,
      task: {
        id: null,
        code: null,
      },
      author: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        picture: currentUser.picture,
      },
    };
    this.smsOttCallService.history
      .updateStatusCall(uniqCode!, body)
      .subscribe((res) => {});
  }
}
