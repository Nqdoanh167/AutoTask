export enum ECallStatus {
  CALLING = 'calling',
  RINGING = 'ringing',
  ANSWERED = 'answered',
  REJECTED = 'rejected',
  HANGUP = 'hangup',
  ENDED = 'ended',
}

export enum ECallType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export enum EPlatformVoice {
  OMICALL = 'omicall',
  STRINGEE = 'stringee',
}

export interface Call {
  from: string;
  to: string;
  status?: ECallStatus;
  callId?: string;
  type: ECallType;
  platform: EPlatformVoice;
}

export enum StringeeSignalingState {
  INIT = 0,
  CALLING = 1,
  RINGING = 2,
  ANSWERED = 3,
  CONNECTED = 4,
  BUSY = 5,
  ENDED = 6,
}

export enum EStringeeOtherDeviceType {
  CALL_STATE = 'CALL_STATE',
  CALL_END = 'CALL_END',
}

export interface StringeeOtherDeviceState {
  type: EStringeeOtherDeviceType;
  code: number;
}

export enum ECallEvent {
  outbound = 'outbound',
  inbound = 'inbound'
}
export const CALL_EVENT = [
  {
    label: 'Cuộc gọi đi',
    value: ECallEvent.outbound,
  },
  {
    label: 'Cuộc gọi đến',
    value: ECallEvent.inbound,
  },
];

export enum EStatusVoice {
  NONE = 'NONE',
  RINGING = 'RINGING',
  CONNECT = 'CONNECT',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  REJECT = 'REJECT',
}

export const STATUS_VOICE = [
  {
    label: 'Không có',
    value: EStatusVoice.NONE,
  },
  {
    label: 'Đổ chuông',
    value: EStatusVoice.RINGING,
  },
  {
    label: 'Kết nối',
    value: EStatusVoice.CONNECT,
  },
  {
    label: 'Thành công',
    value: EStatusVoice.SUCCESS,
  },
  {
    label: 'Từ chối',
    value: EStatusVoice.REJECT,
  },
  {
    label: 'Thất bại',
    value: EStatusVoice.FAIL,
  },
];


