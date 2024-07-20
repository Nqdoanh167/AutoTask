import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {
  Call,
  ECallStatus,
  ECallType,
  StringeeSignalingState,
} from '@app/types/call';
import {
  ManageMappingPhone,
  StringeeReceiveCallEvent,
} from '@app/types/sms-ott-call';
import {StringeeCall, StringeeClient} from 'stringee';
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

  protected stringeeClient: any;
  protected call: any;
  protected authenticatedWithUserId: any;

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

  settingCallEvents(call1: any) {
    call1.on('error', (info: any) => {
      console.log('on error: ' + JSON.stringify(info));
    });

    call1.on('addlocalstream', (stream: any) => {
      console.log('on addlocalstream', stream);
    });

    call1.on('addremotestream', (stream: any) => {
      console.log('on addremotestream', stream);
      const remoteVideo = document.getElementById(
        'remoteVideoPopupCalling',
      ) as HTMLVideoElement;
      remoteVideo.srcObject = null;
      remoteVideo.srcObject = stream;
    });

    call1.on('signalingstate', (state: {reason: StringeeSignalingState}) => {
      console.log('signalingstate ', state);
      if (state.reason === StringeeSignalingState.ENDED) {
        this.updateStatusCall(ECallStatus.ENDED);
      }
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
        const incomingCallObj: Call = {
          from: incomingcall.fromNumber,
          to: incomingcall.toNumber,
          callId: incomingcall.callId,
          status: ECallStatus.RINGING,
          type: ECallType.INCOMING,
        };
        this.setCall(incomingCallObj);
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
      const remoteVideo = document.getElementById(
        'remoteVideoPopupCalling',
      ) as HTMLVideoElement;
      remoteVideo.srcObject = null;
      this.callStopped();
      this.call?.hangup((res: any) => {
        console.log('hangup res', res);
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleCall(phone: string, toPhone: string) {
    const modifiedPhone = String(phone).replace(/^0+|\+/, '84');
    const modifiedToPhone = String(toPhone).replace(/^0+|\+/, '84');
    this.call = new StringeeCall(
      this.stringeeClient,
      modifiedPhone,
      modifiedToPhone,
      false,
    );
    this.settingCallEvents(this.call);
    this.call?.makeCall((res: any) => {
      console.log('make call callback: ', res);
    });
  }

  callStopped() {}
}
