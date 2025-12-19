import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Room } from '../interfaces/room.interface'

@Injectable({
    providedIn: 'root'
})
export class RoomService{
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  rooms$: Observable<Room[]> = this.roomsSubject.asObservable();

  private selectedRoomSubject = new BehaviorSubject<Room | null>(null);
  selectedRoom$: Observable<Room | null> = this.selectedRoomSubject.asObservable();

  setRooms(rooms: Room[]) {
    this.roomsSubject.next(rooms);
  }

  addRoom(room: Room) {
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

  selectRoom(room: Room) {
    this.selectedRoomSubject.next(room);
  }

  clearSelectRoom(){
    this.selectedRoomSubject.next(null);
  }

  updateRoom(updatedRoom: Room) {
    const currentRooms = this.roomsSubject.value;

    const index = currentRooms.findIndex(r => r.roomId === updatedRoom.roomId);
    if (index === -1) return;

    const clonedRoom: Room = JSON.parse(JSON.stringify(updatedRoom));

    const newRooms = currentRooms.map(room =>
      room.roomId === updatedRoom.roomId ? clonedRoom : room
    );

    this.roomsSubject.next(newRooms);

    this.selectedRoomSubject.next(clonedRoom);
  }


}