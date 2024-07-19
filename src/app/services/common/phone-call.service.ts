import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {IncomingCall} from '@app/types/call';
import {
  ManageMappingPhone,
  StringeeReceiveCallEvent,
} from '@app/types/sms-ott-call';
import {StringeeClient} from 'stringee';

@Injectable({
  providedIn: 'root',
})
export class PhoneCallService {
  private incomingCallObj = new BehaviorSubject<IncomingCall | null>(null);

  public connectLoading$ = new BehaviorSubject(false);
  public connectedPhone$ = new BehaviorSubject<ManageMappingPhone | undefined>(
    undefined,
  );

  protected stringeeClient: any;
  protected call: any;
  protected authenticatedWithUserId: any;

  constructor() {}

  getIncomingCall() {
    return this.incomingCallObj.asObservable();
  }

  setIncomingCall(incomingCall: IncomingCall | null) {
    this.incomingCallObj.next(incomingCall);
  }

  settingCallEvents(call1: any) {
    call1.on('error', (info: any) => {
      console.log('on error: ' + JSON.stringify(info));
    });

    call1.on('addlocalstream', (stream: any) => {
      console.log('on addlocalstream', stream);
    });

    call1.on('addremotestream', (stream: any) => {
      console.log('on addremotestream', stream);
    });

    call1.on('signalingstate', (state: any) => {
      console.log('signalingstate ', state);
    });

    call1.on('mediastate', (state: any) => {
      console.log('mediastate ', state);
    });

    call1.on('info', (info: any) => {
      console.log('on info', info);
    });

    call1.on('otherdevice', (data: any) => {
      console.log('on otherdevice', data);
    });
  }

  settingClientEvents() {
    this.stringeeClient.on('connect', () => {
      console.log('connected to StringeeServer');
    });

    this.stringeeClient.on('authen', (res: any) => {
      console.log('on authen: ', res);
      this.connectLoading$.next(false);
      if (res.r === 0) {
        this.authenticatedWithUserId = res.userId;
      } else {
        console.log('authen error: ', res);
        this.connectedPhone$.next(undefined);
      }
    });

    this.stringeeClient.on('disconnect', () => {
      console.log('disconnected');
    });

    this.stringeeClient.on(
      'incomingcall',
      (incomingcall: StringeeReceiveCallEvent) => {
        console.log('incomingcall: ', incomingcall);
        this.call = incomingcall;
        this.settingCallEvents(incomingcall);
        const incomingCallObj: IncomingCall = {
          from: incomingcall.fromNumber,
          to: incomingcall.toNumber,
        };
        this.setIncomingCall(incomingCallObj);
      },
    );

    this.stringeeClient.on('requestnewtoken', () => {
      console.log(`request new token;
            please get new access_token from YourServer
            and call client.connect(new_access_token)`);
    });

    this.stringeeClient.on('otherdeviceauthen', (data: any) => {
      console.log('otherdeviceauthen: ', data);
    });
  }

  loginStringee(token: string) {
    this.stringeeClient = new StringeeClient();
    this.settingClientEvents();
    this.stringeeClient.connect(token);
  }

  handleReject() {
    this.callStopped();
    this.call.reject((res: any) => {
      console.log('reject res', res);
    });
  }

  handleAnswer() {
    this.call.answer((res: any) => {
      console.log('answer res', res);
    });
  }

  handleHangup() {
    try {
      this.callStopped();
      this.call?.hangup((res: any) => {
        console.log('hangup res', res);
      });
    } catch (e) {
      console.log(e);
    }
  }

  callStopped() {}
}
