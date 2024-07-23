import {Injectable} from '@angular/core';
import {
  Call,
  ECallStatus,
  ECallType,
  EStringeeOtherDeviceType,
  StringeeOtherDeviceState,
  StringeeSignalingState,
} from '@app/types/call';
import {
  OutGoingCallEvent,
  StringeeReceiveCallEvent,
} from '@app/types/sms-ott-call';
import {StringeeCall, StringeeClient} from 'stringee';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {ToastrService} from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class StringeeService {
  protected stringeeClient: any;
  protected call: any;
  protected type?: ECallType;
  protected authenticatedWithUserId: any;

  constructor(
    private readonly phoneCallService: PhoneCallService,
    private readonly toarst: ToastrService,
  ) {}

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

    call1.on('signalingstate', (state: {code: StringeeSignalingState}) => {
      console.log('signalingstate ', state);
      let status: ECallStatus | undefined = undefined;
      switch (state.code) {
        case StringeeSignalingState.CALLING:
          status = ECallStatus.CALLING;
          break;
        case StringeeSignalingState.RINGING:
          status = ECallStatus.RINGING;
          break;
        case StringeeSignalingState.ANSWERED:
          status = ECallStatus.ANSWERED;
          break;
        case StringeeSignalingState.ENDED:
          status = ECallStatus.ENDED;
          break;
        default:
          break;
      }
      if (!status) return;
      if (this.type === ECallType.INCOMING) {
        this.phoneCallService.updateStatusIncomingCall(status);
      }
      if (this.type === ECallType.OUTGOING) {
        this.phoneCallService.updateStatusOutgoingCall(status);
      }
    });

    call1.on('mediastate', (state: any) => {
      console.log('mediastate ', state);
    });

    call1.on('info', (info: any) => {
      console.log('on info', info);
    });

    call1.on('otherdevice', (data: StringeeOtherDeviceState) => {
      console.log('on otherdevice', data);
      if (
        data.type === EStringeeOtherDeviceType.CALL_STATE &&
        [200, 486].includes(data.code)
      ) {
        this.phoneCallService.clearIncomingCall();
      }
    });
  }

  settingClientEvents() {
    this.stringeeClient.on('connect', () => {
      console.log('connected to StringeeServer');
    });

    this.stringeeClient.on('authen', (res: any) => {
      console.log('on authen: ', res);
      this.phoneCallService.connectLoading$.next(false);
      if (res.r === 0) {
        this.authenticatedWithUserId = res.userId;
      } else {
        console.log('authen error: ', res);
        this.phoneCallService.connectedPhone$.next(undefined);
      }
    });

    this.stringeeClient.on('disconnect', () => {
      console.log('disconnected');
      if (this.type === ECallType.INCOMING) {
        this.phoneCallService.clearIncomingCall();
      }
      if (this.type === ECallType.OUTGOING) {
        this.phoneCallService.clearOutgoingCall();
      }
    });

    this.stringeeClient.on(
      'incomingcall',
      (incomingcall: StringeeReceiveCallEvent) => {
        console.log('incomingcall: ', incomingcall);
        const currentIncomingCall =
          this.phoneCallService.getIncomingCallValue();
        if (currentIncomingCall) {
          this.toarst.info(
            'Bạn đang có cuộc gọi đến mới từ ' + incomingcall.fromNumber,
          );
          return;
        }
        this.type = ECallType.INCOMING;
        this.call = incomingcall;
        this.settingCallEvents(incomingcall);
        const incomingCallObj: Call = {
          from: incomingcall.fromNumber,
          to: incomingcall.toAlias,
          callId: incomingcall.callId,
          status: ECallStatus.RINGING,
          type: ECallType.INCOMING,
        };
        this.phoneCallService.setIncomingCall(incomingCallObj);
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

  logoutStringee() {
    this.stringeeClient.disconnect();
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
      this.call?.hangup((res: any) => {
        console.log('hangup res', res);
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleMute(value: boolean) {
    this.call?.mute(value);
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
    this.call?.makeCall((res: OutGoingCallEvent) => {
      console.log('make call callback: ', res);
      this.type = ECallType.OUTGOING;
      const outgoingCallObj: Call = {
        from: res.fromNumber,
        to: res.toNumber,
        callId: res.callId,
        type: ECallType.INCOMING,
      };
      this.phoneCallService.setOutgoingCall(outgoingCallObj);
    });
  }

  callStopped() {
    if (this.type === ECallType.INCOMING) {
      this.phoneCallService.clearIncomingCall();
    }
    if (this.type === ECallType.OUTGOING) {
      this.phoneCallService.clearOutgoingCall();
    }
  }
}
