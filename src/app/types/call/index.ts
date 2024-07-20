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

export interface Call {
  from: string;
  to: string;
  status?: ECallStatus;
  callId?: string;
  type: ECallType;
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
