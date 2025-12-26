import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';

import { IPlayerData } from '../../interfaces/socket.interfaces';
import { IRoom } from '../../interfaces/room.interface';
import { RoomService } from '../../services/room.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-live-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-progress.html',
  styleUrls: ['./live-progress.scss'],
})
export class LiveProgress implements OnInit, OnDestroy {
  playersProgress = signal<IPlayerData[]>([]);

  private readonly roomService = inject(RoomService);
  private readonly socket = inject(SocketService);

  ngOnInit(): void {
    // set up initial players from current room
    const room = this.roomService.getCurrentRoom();
    if (room?.data?.players) {
      this.playersProgress.set(room.data.players);
    }

    // update when room changes (progress updates come through here)
    this.socket.on<IRoom>('room-updated', (updatedRoom: IRoom) => {
      if (updatedRoom?.data?.players) {
        this.playersProgress.set(updatedRoom.data.players);
      }
    });
  }

  ngOnDestroy(): void {
    this.socket.off('room-updated');
  }
}
