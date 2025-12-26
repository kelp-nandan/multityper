import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { IRoom } from '../interfaces/room.interface';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private roomsSubject = new BehaviorSubject<IRoom[]>([]);
  rooms$: Observable<IRoom[]> = this.roomsSubject.asObservable();

  private selectedRoomSubject = new BehaviorSubject<IRoom | null>(null);
  selectedRoom$: Observable<IRoom | null> = this.selectedRoomSubject.asObservable();

  setRooms(rooms: IRoom[]): void {
    this.roomsSubject.next(rooms);
  }

  addRoom(room: IRoom): void {
    const currentRooms = this.roomsSubject.value;
    this.roomsSubject.next([...currentRooms, room]);
  }

  removeRoom(roomId: string): void {
    const filtered = this.roomsSubject.value.filter((room) => room.key !== roomId);
    this.roomsSubject.next(filtered);
  }

  selectRoom(room: IRoom): void {
    this.selectedRoomSubject.next(room);
  }

  clearSelectRoom(): void {
    this.selectedRoomSubject.next(null);
  }

  getCurrentRoom(): IRoom | null {
    return this.selectedRoomSubject.value;
  }

  updateRoom(updatedRoom: IRoom): void {
    const currentRooms = this.roomsSubject.value;
    const newRooms = currentRooms.map((room) =>
      room.key === updatedRoom.key ? { ...updatedRoom } : room,
    );
    this.roomsSubject.next(newRooms);
    const currentSelected = this.selectedRoomSubject.value;
    if (currentSelected && currentSelected.key === updatedRoom.key) {
      this.selectedRoomSubject.next({ ...updatedRoom });
    }
  }
}
