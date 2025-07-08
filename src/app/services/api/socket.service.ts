import {Injectable} from '@angular/core';
import {Observable, Subject, takeUntil} from 'rxjs';
import {io, Socket} from 'socket.io-client';
import {AuthService} from './auth.service';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private destroy = new Subject<void>();
  private bizId!: string;
  private bizAlias!: string;
  private pingIntervalId: any;

  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (biz) => {
        this.bizAlias = biz?.alias;
      },
    });

    this.socket = io(environment.apiSocket, {
      auth: {
        bizAlias: this.bizAlias,
        token: `Bearer ${this.authService.getToken()}`,
      },
      path: environment.apiSocketPath,
      transports: ['websocket', 'polling'],
    });

    this.socket.emit('JOIN_ROOM', {
      bizAlias: this.bizAlias,
      token: `Bearer ${this.authService.getToken()}`,
    });

    this.socket.on('room/JOIN_SUCCESS', (data) => {
      this.bizId = data.bizId;
      this.startPing();
    });

    this.socket.on('disconnect', () => {
      this.stopPing();
    });
  }

  private startPing() {
    this.stopPing(); 
    this.pingIntervalId = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', {
          active: true,
          bizId: this.bizId,
        });
      }
    }, 3 * 60 * 1000);
  }

  private stopPing() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
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

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.destroy.next();
      this.destroy.complete();
    }
  }
}
