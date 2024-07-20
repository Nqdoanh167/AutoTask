export enum ECallStatus {
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
  ENDED = 'Ended',
}
