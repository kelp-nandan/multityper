import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRoom } from '../interfaces/room.interface'

@Injectable({
    providedIn: 'root'
})
export class RoomService{
  private roomsSubject = new BehaviorSubject<IRoom[]>([]);
  rooms$: Observable<IRoom[]> = this.roomsSubject.asObservable();

  private selectedRoomSubject = new BehaviorSubject<IRoom | null>(null);
  selectedRoom$: Observable<IRoom | null> = this.selectedRoomSubject.asObservable();

  setRooms(rooms: IRoom[]) {
    this.roomsSubject.next(rooms);
  }

  addRoom(room: IRoom) {
    const currentRooms = this.roomsSubject.value;
    this.roomsSubject.next([...currentRooms, room]);
    this.selectRoom(room);
  }

  removeRoom(roomId: string) {
    const filtered = this.roomsSubject.value.filter(
      (room) => room.roomId !== roomId
    );
    this.roomsSubject.next(filtered);
  }

  selectRoom(room: IRoom) {
    this.selectedRoomSubject.next(room);
  }

  clearSelectRoom(){
    this.selectedRoomSubject.next(null);
  }

  updateRoom(updatedRoom: IRoom) {
    const currentRooms = this.roomsSubject.value;
    const index = currentRooms.findIndex(r => r.roomId === updatedRoom.roomId);
    if (index === -1) return;
    const clonedRoom: IRoom = JSON.parse(JSON.stringify(updatedRoom));
    const newRooms = currentRooms.map(room =>
      room.roomId === updatedRoom.roomId ? clonedRoom : room
    );
    this.roomsSubject.next(newRooms);
    this.selectedRoomSubject.next(clonedRoom);
  }
}