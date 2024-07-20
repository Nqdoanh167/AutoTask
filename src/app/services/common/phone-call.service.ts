import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Call, ECallStatus} from '@app/types/call';
import {ManageMappingPhone} from '@app/types/sms-ott-call';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';

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

  constructor(private readonly smsOttCallService: SmsOttCallService) {}

  getIncomingCall() {
    return this.incomingCallObj.asObservable();
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

  updateStatusOutgoingCall(status: ECallStatus) {
    const currentCall = this.outgoingCallObj.getValue();
    if (currentCall) {
      currentCall.status = status;
      this.outgoingCallObj.next(currentCall);
    }
  }

  clearIncomingCall() {
    this.incomingCallObj.next(null);
  }

  clearOutgoingCall() {
    this.outgoingCallObj.next(null);
  }
}
