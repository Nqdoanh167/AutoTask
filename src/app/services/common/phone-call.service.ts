import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {IncomingCall} from '@app/types/call';

@Injectable({
  providedIn: 'root',
})
export class PhoneCallService {
  private incomingCallObj = new BehaviorSubject<IncomingCall | null>(null);
  constructor() {}

  getIncomingCall() {
    return this.incomingCallObj.asObservable();
  }

  setIncomingCall(incomingCall: IncomingCall | null) {
    this.incomingCallObj.next(incomingCall);
  }
}
