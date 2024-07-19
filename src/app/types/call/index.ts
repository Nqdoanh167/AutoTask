export enum ECallStatus {
  RINGING = 'ringing',
  ANSWERED = 'answered',
  REJECTED = 'rejected',
  HANGUP = 'hangup',
  ENDED = 'ended',
}

export interface IncomingCall {
  from: string;
  to: string;
  status?: ECallStatus;
}

export enum StringeeSignalingState {
  ENDED = 'ENDED',
}
