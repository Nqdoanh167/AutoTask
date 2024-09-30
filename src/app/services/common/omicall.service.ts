import {Injectable} from '@angular/core';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {ToastrService} from 'ngx-toastr';
import {EStatusVoice} from '@app/types/sms-ott-call';
import {EPlatformVoice} from '@app/types/call';

declare const omiSDK: any;

@Injectable({
  providedIn: 'root',
})
export class OmicallService {
  constructor(
    private readonly phoneCallService: PhoneCallService,
    private readonly toarst: ToastrService,
  ) {}

  omicallInit(dataConfig: any) {
    omiSDK.unregister();
    const {domain, sipUser, password} = dataConfig;
    let config = {
      theme: 'default',
      callbacks: {
        register: (data: any) => {
          // Sự kiện xảy ra khi trạng thái kết nối tổng đài thay đổi
          console.log('register:', data);
        },
        connecting: (data: any) => {
          // Sự kiện xảy ra khi bắt đầu thực hiện cuộc gọi ra
          console.log('connecting:', data);
        },
        invite: (data: any) => {
          // Sự kiện xảy ra khi có cuộc gọi tới
          console.log('invite:', data);
          this.phoneCallService.setIncomingCall({
            phoneNumber: data.phone,
            callId: data.uuid,
            callType: 'voice',
            status: 'incoming',
            platform: EPlatformVoice.OMICALL,
          } as any);
        },
        inviteRejected: (data: any) => {
          // Sự kiện xảy ra khi có cuộc gọi tới, nhưng bị tự động từ chối
          // trong khi đang diễn ra một cuộc gọi khác
          console.log('inviteRejected:', data);
        },
        ringing: (data: any) => {
          // Sự kiện xảy ra khi cuộc gọi ra bắt đầu đổ chuông
          console.log('ringing:', data);
        },
        accepted: (data: any) => {
          // Sự kiện xảy ra khi cuộc gọi vừa được chấp nhận
          console.log('accepted:', data);
        },
        incall: (data: any) => {
          // Sự kiện xảy ra mỗi 1 giây sau khi cuộc gọi đã được chấp nhận
          console.log('incall:', data);
        },
        acceptedByOther: (data: any) => {
          // Sự kiện dùng để kiểm tra xem cuộc gọi bị kết thúc
          // đã được chấp nhận ở thiết bị khác hay không
          console.log('acceptedByOther:', data);
        },
        ended: (data: any) => {
          // Sự kiện xảy ra khi cuộc gọi kết thúc
          console.log('ended:', data);
          if (data.direction === 'inbound' && data.endCause === 'UNKNOWN') {
            this.phoneCallService.updateHistoricalCallStatus(
              EStatusVoice.REJECT,
            );
          }
          const footerModalCall = document.getElementById('footer-modal-call');
          if (!footerModalCall) return;
          footerModalCall.style.visibility = 'visible';
        },
        holdChanged: (status: any) => {
          // Sự kiện xảy ra khi trạng thái giữ cuộc gọi thay đổi
          console.log('on hold:', status);
        },
        saveCallInfo: (data: any) => {
          // let { callId, note, ...formData } = data;
          // Sự kiện xảy ra khi cuộc gọi đã có đổ chuông hoặc cuộc gọi tới, khi user có nhập note input mặc định hoặc form input custom
          console.log('on save call info:', data);
        },
        infoLastCall: (data: any) => {
          // Sự kiện xảy ra khi có bật options.showInfoLastCall và SDK có get được data cho số điện thoại đang gọi
          console.log('on found info last call:', data);
        },
      },
    };
    omiSDK.init(config, () => {
      omiSDK.register({
        domain,
        username: sipUser, // tương đương trường "sip_user" trong thông tin số nội bộ
        password,
      });
    });
  }

  omicallMakeCall(
    phoneNumber: any,
    hotline: any,
    user: any,
    taskId: any,
    taskCode: any,
  ) {
    try {
      omiSDK.makeCall(phoneNumber, {
        sipNumber: hotline,
        datas: {
          'User-Data': JSON.stringify({
            module: 'auto-task',
            userId: user.id,
            taskId,
            taskCode,
          }),
        },
      });
      const footerModalCall = document.getElementById('footer-modal-call');
      if (!footerModalCall) return;
      footerModalCall.style.visibility = 'hidden';
    } catch (e) {
      console.log(e);
    }
  }
}
