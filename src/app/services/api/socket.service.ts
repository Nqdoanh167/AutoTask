import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private destroy = new Subject<void>();
  private bizId!: string;
  private bizAlias!: string;
  private clientId!: string;
  private heartbeatInterval: any = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private retryCount = 0;
  private readonly MAX_RETRIES = 15;
  private isManualDisconnect = false;

  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (biz) => {
        this.bizAlias = biz?.alias;
      },
    });
  }

  private initSocket(): void {
    if (!this.bizAlias) return;

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(environment.apiSocket, {
      auth: {
        bizAlias: this.bizAlias,
        token: `Bearer ${this.authService.getToken()}`,
      },
      path: environment.apiSocketPath,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.MAX_RETRIES,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.retryCount = 0;
      this.joinRoom();
    });

    this.socket.on('reconnect', () => {
      this.retryCount = 0;
      this.joinRoom();
    });

    this.socket.on('connect_error', (error) => {
      this.stopHeartbeat();
      console.warn('Socket connection error:', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.retryCount = attemptNumber;
      console.log(`Socket reconnection attempt ${attemptNumber}/${this.MAX_RETRIES}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      this.retryCount = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.stopHeartbeat();
      // Reset retry count if disconnect is not manual
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.isManualDisconnect = true;
      } else {
        this.isManualDisconnect = false;
      }
    });

    this.socket.on('room/JOIN_SUCCESS', (data) => {
      this.bizId = data.bizId;
      this.clientId = data.clientId;
      this.authService.setCurrentClientSocketId(this.clientId);
      this.startHeartbeat();
    });
  }

  private joinRoom(): void {
    if (!this.socket || !this.socket.connected || !this.bizAlias) {
      return;
    }

    this.socket.emit('JOIN_ROOM', {
      bizAlias: this.bizAlias,
      token: `Bearer ${this.authService.getToken()}`,
    });
  }

  connect(): void {
    this.isManualDisconnect = false;
    this.retryCount = 0;
    if (!this.socket || !this.socket.connected) {
      this.initSocket();
    } else {
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    this.retryCount = 0;
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (!this.socket || !this.socket.connected) {
      return;
    }
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        const userId = this.authService.getCurrentUser()?.id;
        if (userId) {
        this.socket.emit('app/HEARTBEAT', {
          bizId: this.bizId,
            clientId: this.clientId,
            userId,
            timestamp: Date.now(),
          });
        }
      } else {
        this.stopHeartbeat();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    this.destroy.next();
    this.destroy.complete();
    this.disconnect();
  }

  listen(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(eventName, (data) => {
        observer.next(data);
      });

      this.socket.on('disconnect', () => {
        observer.complete();
      });
    });
  }

  emit(eventName: string, data: any): void {
    this.socket.emit(eventName, {
      data,
      bizId: this.bizId,
    });
  }
}
