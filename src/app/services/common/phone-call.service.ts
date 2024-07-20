import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Call, ECallStatus} from '@app/types/call';
import {ManageMappingPhone} from '@app/types/sms-ott-call';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';

@Injectable({
  providedIn: 'root',
})
export class PhoneCallService {
  private callObj = new BehaviorSubject<Call | null>(null);

  public connectLoading$ = new BehaviorSubject(false);
  public connectedPhone$ = new BehaviorSubject<ManageMappingPhone | undefined>(
    undefined,
  );

  constructor(private readonly smsOttCallService: SmsOttCallService) {}

  getCall() {
    return this.callObj.asObservable();
  }

  setCall(incomingCall: Call | null) {
    this.callObj.next(incomingCall);
  }

  updateStatusCall(status: ECallStatus) {
    const currentCall = this.callObj.getValue();
    if (currentCall) {
      currentCall.status = status;
      this.callObj.next(currentCall);
    }
  }
}
