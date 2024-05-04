export type StringeeVideoDimension =
  | {
      min: string;
      max: string;
    }
  | {
      ideal: string;
    };

export type StringeeVideoDimensions = {
  width: StringeeVideoDimension;
  height: StringeeVideoDimension;
};

export type StringeeIceServer = {
  urls: string;
  credential: string;
  username: string;
};

export type StringeeOnAuthenticatedResponse = {
  r: number;
  requestId: number;
  userId: string;
  connectionId: string;
  message: string;
  ping_after_ms: number;
  projectId: number;
  clients: Array<{
    browserId: string;
    clientId: string;
    deviceName: string;
    platform: number;
  }>;
  ice_servers: StringeeIceServer[];
};

export type StringeeRoomAddTrackEventData = {
  info: {
    roomId: string;
    track: StringeeRemoteTrack;
  };
};

export type StringeeRoomRemoveTrackEventData = StringeeRoomAddTrackEventData & {
  track: StringeeVideoTrack;
};

export type StringeeRoomJoinEventData = {
  info: {
    roomId: string;
    stringeeClientId: string;
    user: StringeeUserInfo;
  };
};

export type StringeeRoomLeaveEventData = {
  info: {
    roomId: string;
    reason: string;
    removeAllStringeeClients: boolean;
    user: StringeeUserInfo;
  };
};

export type RoomTrackMediaChangeEventData = {
  enable: boolean;
  mediaChange: 'audio' | 'video';
  track: StringeeVideoTrack;
};

export type StringeeUserInfo = {
  attributes: any[];
  canCallout: boolean;
  chatCustomer: boolean;
  loginTime: number;
  userId: string;
};

export type StringeeError = {
  r?: number;
  code?: number;
  jsError: Error;
  msg: string;
};

export interface StringeeLocalTrack {
  screen: boolean;
  localVideoEnabled: boolean;
  muted: boolean;

  switchCamera(): void;
  enableLocalVideo(enabled: boolean): void;
  attach(): HTMLVideoElement;
  close(): void;
  detachAndRemove(): void;
  mute(muted: boolean): void;
  routeAudioToSpeaker(selectedSpeakerId: string): void;
  on(evName: 'ready', callback: () => unknown): void;
}

export interface StringeeRemoteTrack {
  audio: boolean;
  isPlayer: boolean;
  screen: boolean;
  serverId: string;
  stringeeClientPublish: string;
  userPublish: string;
  video: boolean;
}

export type StringeePublishOptions = {
  audio?: boolean;
  video?: boolean;
  screen?: boolean;
  screenAudio?: boolean;
  videoDimensions?: StringeeVideoDimensions;
  mobileCamera?: 'front' | 'back';
  audioDeviceId?: string;
  videoDeviceId?: string;
};

interface StringeeConferenceRoom {
  mapServerIdTracks: any[];
  permissionControlRoom: boolean;
  permissionPublish: boolean;
  permissionSubscribe: boolean;
  record: boolean;
  roomId: string;
  stringeeClient: StringeeClient;
  tracks: any[];

  clearAllOnMethos(): void;
  subscribe(
    serverId: string,
    subscribeOptions?: StringeePublishOptions,
  ): Promise<StringeeVideoTrack>;
  publish(localTrack: StringeeVideoTrack): Promise<void>;
  unpublish(localTrack: StringeeVideoTrack): void;
  leave(b: true): Promise<any>;
  sendMessage(msg: unknown): Promise<void>;
  unsubscribe(track: StringeeVideoTrack): Promise<void>;
  sendRenderLayoutInfo(e: any, t: any): void;

  on(
    evName: 'joinroom',
    callback: (event: StringeeRoomJoinEventData) => unknown,
  ): void;
  on(
    evName: 'leaveroom',
    callback: (event: StringeeRoomLeaveEventData) => unknown,
  ): void;
  on(evName: 'message', callback: (event: any) => unknown): void;
  on(
    evName: 'addtrack',
    callback: (event: StringeeRoomAddTrackEventData) => unknown,
  ): void;
  on(
    evName: 'removetrack',
    callback: (event: StringeeRoomRemoveTrackEventData) => unknown,
  ): void;
  on(
    evName: 'trackmediachange',
    callback: (event: RoomTrackMediaChangeEventData) => unknown,
  ): void;
}

export type StringeeDevice = {
  deviceId: string;
  label: string;
};

export type StringeeCameraDevice = StringeeDevice;
export type StringeeMicrophoneDevice = StringeeDevice;
export type StringeeSpeakerDevice = StringeeDevice;

export type StringeeDevicesInfo = {
  cameras: StringeeCameraDevice[];
  microphones: StringeeMicrophoneDevice[];
  speakers: StringeeSpeakerDevice[];
};

export type StringeeMediaState = {
  isConnected: boolean;
  isLocal: boolean;
  localId: string;
  roomId: string;
  serverPcId: string;
  serverTrackId: string;
};

declare class StringeeClient {
  constructor(endpoints?: string[]);

  accessToken: string;
  allClients: string[];
  allClientsOfThisBrowser: string[];
  alreadyTried: boolean;
  browserId: string;
  deviceId: string;
  disconnectByUser: boolean;
  hasConnected: boolean;
  healtcheckInterval: number;
  ice_servers: StringeeIceServer[];
  lastTimeStampReceivedPacket: number;
  masterServer: any;
  numberOfRetryConnect: number;
  sessionId: string;
  socket: {
    alreadyTried: boolean;
    healthCheckInterval: number;
    serverAddr: string;
    userDisconnect: boolean;
    timeoutReconnectMethod: any;
    serverAddressIsDead: boolean;
  };
  stringeeServerAddrIndex: number;
  stringeeServerAddrs: string[];
  tempWebsocketURL: string[];
  timeoutToReconnect: 60000;
  userId: string;

  connect(access_token: string): void;

  on(evName: 'connect', callback: () => unknown): void;
  on(
    evName: 'authen',
    callback: (res: StringeeOnAuthenticatedResponse) => unknown,
  ): void;
  on(evName: 'disconnect', callback: () => unknown): void;
  on(evName: 'requestnewtoken', callback: () => unknown): void;
  on(enName: 'otherdeviceauthen', callback: (args: any) => unknown): void;
  on(
    enName: 'chatmessage',
    callback: (message: StringeeMessage) => unknown,
  ): void;
  on(
    enName: 'chatmessagestate',
    callback: (message: StringeeChatMessageState) => unknown,
  ): void;

  disconnect(): void;
  findCall2ByCallId(id: string): any;
  findCallByCallId(id: string): any;
  getBrowserId(): string;
  getClientId(): string;
  getURLToConnect(): string;
  isActiveClient(): boolean;
  sendCustomMessage(
    userId: string,
    message: Record<string, unknown>,
    callback: (message: string) => unknown,
  ): void;
  setThisClientIsActive(isActive: boolean): void;
}

declare class StringeeVideoTrack {
  constructor(client: StringeeClient, pubOptions: Record<string, any>);

  audio: boolean;
  audioDeviceId: string | null;
  callOnReady: boolean;
  isLocal: boolean;
  constraints: Record<string, any>;
  elements: any[];
  lastAudioBytesReceived: number;
  lastAudioBytesSent: number;
  lastTimestampGetBytes: number;
  lastVideoBytesReceived: number;
  lastVideoBytesSent: number;
  localAudioEnabled: boolean;
  localCandidatesForSend: any[];
  localId: string;
  localSdpToSend: any;
  localVideoEnabled: boolean;
  mobileCamera: 'front' | 'back';
  muted: boolean;
  onMethods: any[];
  roomConnected: boolean;
  screen: boolean;
  screenAudio: boolean;
  serverId: string;
  serverPeerConnectionId: string;
  speakerDeviceId: string | null;
  stringeeClient: StringeeClient;
  userData: any;
  userPublish: string;
  video: boolean;
  videoDeviceId: string | null;

  webrtc: {
    iceServers: unknown;
    localAudioEnabled: boolean;
    localCandidates: any[];
    localConstraints: Record<string, any>;
    localId: string;
    localSdp: any;
    localVideoEnabled: boolean;
    mediaConnected: boolean;
    muted: boolean;
    pc: any;
    remoteStream: any;
    serverId: string;
    stopped: false;
    localStream?: MediaStream;

    changeDevice(e: any, t: any): void;
    enableLocalVideo(e: any): void;
    freeResource(): void;
    initPeerConnection(e: any, t: any, n: any, r: any): void;
    initPeerConnectionNoAccessDevice(e: any, t: any, n: any): void;
    mute(e: any): void;
    onReceiveCandidate(e: any): void;
    onReceiveSdp(e: any): void;

    eventHandler: {
      onCandidate(e: any): void;
      onIceConnectionStateChange(e: any): void;
      onTrack(e: any, t: any): void;
      onTrackEnded(): void;
      onWebRtcClose(): void;
    };
  };

  init(): Promise<StringeeVideoTrack>;
  on(evName: 'ready', callback: (deviceTypes: string[]) => unknown): void;
  on(
    evName: 'mediastate',
    callback: (mediaState: StringeeMediaState) => unknown,
  ): void;
  on(
    evName: 'gotDevicesInfo',
    callback: (data: StringeeDevicesInfo) => unknown,
  ): void;
  on(
    evName: 'changedevice',
    callback: (data: {
      type: 'video' | 'audio' | 'both';
      newDeiceId: string;
      newOptions: StringeePublishOptions;
    }) => unknown,
  ): void;
  on(evName: 'trackended', callback: (...args: any[]) => unknown): void;
  attach(): HTMLVideoElement;
  detach(): HTMLVideoElement[];

  changeDevice(
    deviceType: 'video' | 'audio' | 'both',
    deviceId: string | null,
    options?: StringeePublishOptions,
  ): Promise<void>;

  buildConstraints(ev: any): void;
  callOnEvent(evName: string, t: any): void;
  detachAndRemove(): void;
  disableRemoteAudio(): Promise<unknown>;
  disableRemoteVideo(): Promise<unknown>;
  enableLocalVideo(e: unknown): Promise<unknown>;
  getBW(): Promise<unknown>;
  getMediaStream(): any;
  getStats(callback: (stats: unknown) => unknown): any;
  mute(muted: boolean): Promise<unknown>;
  onCandidateFromServer(callback: (...args: unknown[]) => unknown): void;
  onRemoteStream(e: any, t: any): void;
  onSdpFromServer(e: any): void;
  processSendSdpCandidate(): void;
  routeAudioToSpeaker(speakerId: string): boolean;
  switchCamera(): void;
  close(): void;
}

export type StringeeJoinRoomResult = {
  room: StringeeConferenceRoom;
  listTracksInfo: StringeeRemoteTrack[];
  listStringeeClients: Array<{
    id: string;
    user: string;
  }>;
  listUsersInfo: Array<StringeeUserInfo>;
};

declare class StringeeVideo {
  static joinRoom(
    client: StringeeClient,
    roomToken: string,
  ): Promise<StringeeJoinRoomResult>;
  static getDevicesInfo(): Promise<StringeeDevicesInfo>;
}

declare class StringeeUtil {
  static isWebRTCSupported(): boolean;
  static version(): {
    version: string;
    build: string;
  };

  static getDevicesInfo(): Promise<StringeeDevicesInfo>;
}

declare class StringeeMessage {
  id: string;
  type: number;
  conversationId: string;
  createdAt: number;
  localId: string;
  sender: string;
  sequence: number;
  state: number;
  content: {
    audio?: {
      duration: number;
      filePath: string;
    };
    contact?: {
      vcard: string;
    };
    file?: {
      filePath: string;
      filename: string;
      length: number;
    };
    location: {
      lat: number;
      lon: number;
    };
    photo?: {
      filePath: string;
      thumbnail: string;
      ratio: string;
    };
    content?: string;
    video?: {
      filePath: string;
      thumbnail: string;
      ratio: string;
      duration: string;
    };
    sticker?: {
      name: string;
      category: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export type StringeeChatMessageState = {
  convId: string;
  status: number;
  from: string;
  lastMsgSeq: number;
  lastMsgTimestamp: number;
};
