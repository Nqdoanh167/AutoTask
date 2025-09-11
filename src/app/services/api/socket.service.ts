import { Injectable } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private destroy = new Subject<void>();
  private bizId!: string;
  private bizAlias!: string;
  private clientId!: string;

  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (biz) => {
        this.bizAlias = biz?.alias;
      },
    });
  }

  private initSocket(): void {
    if (!this.bizAlias) return;

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
      this.clientId = data.clientId;
      this.authService.setCurrentClientSocketId(this.clientId);
    });
  }

  connect(): void {
    if (!this.socket || !this.socket.connected) {
      this.initSocket();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
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
}
