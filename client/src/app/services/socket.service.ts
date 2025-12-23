import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { IRoom } from '../interfaces/room.interface';
import { ISocketRoomData } from '../interfaces';
import { RoomService } from './room.service';
import { SERVER_URL } from '../constants/index';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor(private roomService: RoomService, private ngZone: NgZone, private router: Router) {
    this.socket = io(SERVER_URL, {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.handleGetAllRooms();

      // PERSISTENCE: Rejoin the room if the page was refreshed
      const savedRoomId = localStorage.getItem('activeRoomId');
      if (savedRoomId) {
        this.handleJoinRoom(savedRoomId);
      }
    });

    this.listenEvents();
  }

  private convertSocketDataToRoom(item: ISocketRoomData): IRoom {
    return {
      roomId: item.key,
      roomName: item.data.roomName,
      players: item.data.players,
      gameStarted: item.data.isGameStarted
    };
  }

  private listenEvents() {
    this.socket.on('set-all-rooms', (data: ISocketRoomData[]) => {
      this.ngZone.run(() => {
        const rooms: IRoom[] = data.map(item => this.convertSocketDataToRoom(item));
        this.roomService.setRooms(rooms);
      });
    });

    // When I create a room, select it and navigate
    this.socket.on('room-created-by-me', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        const room: IRoom = this.convertSocketDataToRoom(item);
        this.roomService.addRoom(room);
        this.roomService.selectRoom(room);

        // Save to localStorage to prevent losing room on refresh
        localStorage.setItem('activeRoomId', room.roomId);

        this.router.navigate(['/participants']);
      });
    });

    // When someone else creates a room, just add to list
    this.socket.on('new-room-available', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        const room: IRoom = this.convertSocketDataToRoom(item);
        this.roomService.addRoom(room);
      });
    });

    this.socket.on('room-updated', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        let updatedRoom: IRoom;
        if (item.key && item.data) {
          updatedRoom = this.convertSocketDataToRoom(item);
        } else {
          updatedRoom = item as unknown as IRoom;
        }
        this.roomService.updateRoom(updatedRoom);
      });
    });

    this.socket.on('joined-room', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        const room: IRoom = this.convertSocketDataToRoom(item);
        this.roomService.selectRoom(room);

        // Save to localStorage to prevent losing room on refresh
        localStorage.setItem('activeRoomId', room.roomId);

        this.router.navigate(['/participants']);
      });
    });

    this.socket.on('join-room-error', (data: { message: string }) => {
      this.ngZone.run(() => {
        console.error('Failed to join room:', data.message);
        alert(data.message);
      });
    });

    this.socket.on('room-destroyed', (data: { roomId: string }) => {
      this.ngZone.run(() => {
        const currentRoom = this.roomService.getCurrentRoom();
        if (currentRoom && currentRoom.roomId === data.roomId) {
          this.roomService.clearSelectRoom();

          // Clear persistence on room destruction
          localStorage.removeItem('activeRoomId');

          this.router.navigate(['/homepage']);
        }
        this.roomService.removeRoom(data.roomId);
      });
    });

    this.socket.on('game-started', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        let updatedRoom: IRoom;
        if (item.key && item.data) {
          updatedRoom = this.convertSocketDataToRoom(item);
        } else {
          updatedRoom = item as unknown as IRoom;
        }
        this.roomService.updateRoom(updatedRoom);
        this.router.navigate(['/game-dashboard']);
      });
    });

    this.socket.on('lock-room', (item: ISocketRoomData) => {
      this.ngZone.run(() => {
        const currentRoom = this.roomService.getCurrentRoom();
        const roomId = item.key || (item as any).roomId;
        if (!currentRoom || currentRoom.roomId !== roomId) {
          this.roomService.removeRoom(roomId);
        } else {
          let updatedRoom: IRoom;
          if (item.key && item.data) {
            updatedRoom = this.convertSocketDataToRoom(item);
          } else {
            updatedRoom = item as unknown as IRoom;
          }
          this.roomService.updateRoom(updatedRoom);
        }
      });
    });
  }

  handleCreateRoom(data: { roomName: string }) {
    this.socket.emit('create-room', data);
  }

  handleJoinRoom(roomId: string) {
    this.socket.emit('join-room', { roomId });
  }

  handleDestroyRoom(roomId: string) {
    this.socket.emit('destroy-room', { roomId });
  }

  handleGetAllRooms() {
    this.socket.emit('get-all-rooms');
  }

  handleCountdown(roomId: string) {
    this.socket.emit('countdown', roomId);
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
}