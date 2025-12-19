import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Room } from '../interfaces/room.interface';
import { RoomService } from './room.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor(private roomService: RoomService, private ngZone: NgZone) {
    this.socket = io('http://localhost:3000', {
      withCredentials: true
    });
    this.socket.on('connect', () => {
        this.handleTesting();
        this.handleGetAllRooms();
    })
    this.listenEvents();
  }


  private listenEvents() {
    
    this.socket.on('test', (data: { msg: string }) => {
        console.log(data.msg, " from backend");
    });

    this.socket.on('set-all-rooms', (data: any[]) => {
      this.ngZone.run(() => {
        const rooms: Room[] = data.map((item) => ({
          roomId: item.key,
          roomName: item.data.roomName,
          players: item.data.players,
        }));

        this.roomService.setRooms(rooms);
      });
    });

    this.socket.on('created-room', (item: any) => {
      this.ngZone.run(() => {
        const room: Room = {
          roomId: item.key,
          roomName: item.data.roomName,
          players: item.data.players,
        };

        this.roomService.addRoom(room);
      });
    });

    this.socket.on('room-updated', (item: any) => {
      this.ngZone.run(() => {
        console.log("Room updated event received:", item);
        
        let updatedRoom: Room;
        if (item.key && item.data) {
          updatedRoom = {
            roomId: item.key,
            roomName: item.data.roomName,
            players: item.data.players,
          };
        } else {
          updatedRoom = item;
        }
        
        this.roomService.updateRoom(updatedRoom);
      });
    });

    this.socket.on('room-destroyed', (data: {roomId: string}) => {
      this.ngZone.run(() => {
        console.log('Room destroyed:', data.roomId);
        this.roomService.removeRoom(data.roomId);
        this.roomService.clearSelectRoom();
      })
    });

  }

  handleTesting() {
    this.socket.emit('testing', {msg: 'Hello from client'});
  }

  handleCreateRoom(data: { roomName: string }){
    this.socket.emit('create-room', data);
  }
  
  handleJoinRoom(roomId: string) {
    console.log(roomId);
    this.socket.emit('join-room', { roomId });
  }

  handleDestroyRoom(roomId: string) {
    this.socket.emit('destroy-room', { roomId });
  }

  handleGetAllRooms(){
    this.socket.emit('get-all-rooms');
  }

}
 