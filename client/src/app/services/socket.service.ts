import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { IRoom } from '../interfaces/room.interface';
import { RoomService } from './room.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  private readonly roomService = inject(RoomService);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);

  constructor() {
    this.socket = io('/', {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.handleGetAllRooms();
    });

    this.listenEvents();
  }

  private listenEvents(): void {
    this.socket.on('set-all-rooms', (data: IRoom[]) => {
      this.ngZone.run(() => {
        this.roomService.setRooms(data);
      });
    });

    this.socket.on('room-created-by-me', (item: IRoom) => {
      this.ngZone.run(() => {
        this.roomService.addRoom(item);
        this.roomService.selectRoom(item);
        this.router.navigate([`/rooms/${item.key}`]);
      });
    });

    this.socket.on('left-room-by-me', () => {
      this.roomService.clearSelectRoom();
      this.router.navigate(['/homepage']);
    });

    this.socket.on('new-room-available', (item: IRoom) => {
      this.ngZone.run(() => {
        this.roomService.addRoom(item);
      });
    });

    this.socket.on('room-updated', (item: IRoom) => {
      this.ngZone.run(() => {
        this.roomService.updateRoom(item);
      });
    });

    this.socket.on('joined-room', (item: IRoom) => {
      this.ngZone.run(() => {
        this.roomService.selectRoom(item);
        this.router.navigate([`/rooms/${item.key}`]);
      });
    });

    this.socket.on('room-destroyed', (data: { roomId: string }) => {
      this.ngZone.run(() => {
        const currentRoom = this.roomService.getCurrentRoom();
        if (currentRoom && currentRoom.key === data.roomId) {
          this.roomService.clearSelectRoom();
          this.router.navigate(['/homepage']);
        }
        this.roomService.removeRoom(data.roomId);
      });
    });

    this.socket.on('game-started', (item: IRoom) => {
      this.ngZone.run(() => {
        this.roomService.updateRoom(item);
        this.router.navigate(['/game-dashboard']);
      });
    });

    this.socket.on('lock-room', (item: IRoom) => {
      this.ngZone.run(() => {
        const currentRoom = this.roomService.getCurrentRoom();
        const roomId = item.key || (item as IRoom & { roomId?: string }).roomId;
        if (roomId && (!currentRoom || currentRoom.key !== roomId)) {
          this.roomService.removeRoom(roomId);
        } else {
          this.roomService.updateRoom(item);
        }
      });
    });

    this.socket.on('join-room-error', (data: { message: string }) => {
      this.ngZone.run(() => {
        alert(data.message);
      });
    });
  }

  handleCreateRoom(data: { roomName: string }): void {
    this.socket.emit('create-room', data);
  }

  handleJoinRoom(roomId: string): void {
    this.socket.emit('join-room', { roomId });
  }

  handleLeaveRoom(roomId: string): void {
    this.socket.emit('leave-room', { roomId });
  }

  handleDestroyRoom(roomId: string): void {
    this.socket.emit('destroy-room', { roomId });
  }

  handleGetAllRooms(): void {
    this.socket.emit('get-all-rooms');
  }

  handleCountdown(roomId: string): void {
    this.socket.emit('countdown', roomId);
  }

  handleRestoreRoom(roomId: string): void {
    this.socket.emit('get-room', { roomId });
  }

  handleLiveProgress(
    roomId: string,
    percentage: number,
    wpm: number = 0,
    accuracy: number = 0,
  ): void {
    this.socket.emit('live-progress', { progress: percentage, wpm, accuracy, roomId });
  }
  // Expose socket.on method for components with generic typing
  on<T = unknown>(event: string, callback: (data: T) => void): void {
    this.socket.on(event, (data: T) => {
      this.ngZone.run(() => callback(data));
    });
  }

  // Expose socket.off method for components
  off(event: string, callback?: (data: unknown) => void): void {
    this.socket.off(event, callback);
  }

  // General emit method for components with optional generic typing
  emit<T = unknown>(event: string, data?: T): void {
    this.socket.emit(event, data);
  }

  // Observable-based listen method
  listen<T = unknown>(event: string) {
    return new Observable<T>((observer) => {
      this.socket.on(event, (data: T) => {
        this.ngZone.run(() => observer.next(data));
      });
    });
  }
}
