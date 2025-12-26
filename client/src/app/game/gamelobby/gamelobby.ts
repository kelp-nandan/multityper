import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { AuthService } from '../../identity/services/auth.service';
import { IRoom } from '../../interfaces/room.interface';
import { IUser } from '../../interfaces/auth.interfaces';
import { RoomService } from '../../services/room.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-gamelobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gamelobby.html',
  styleUrls: ['./gamelobby.scss'],
})
export class GameLobby implements OnInit, OnDestroy {
  room$!: Observable<IRoom | null>;
  isCreator = signal<boolean>(false);
  private currentUser: IUser | null;
  roomDetails = signal<IRoom | null>(null);
  private subscriptions: Subscription[] = [];

  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.currentUser = this.authService.currentUser();
  }

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('_id');

    if (!roomId) {
      this.router.navigate(['/homepage']);
      return;
    }
    this.socketService.handleRestoreRoom(roomId);
    this.room$ = this.roomService.selectedRoom$;

    const roomSub = this.roomService.selectedRoom$.subscribe((room: IRoom | null) => {
      if (room) {
        this.roomDetails.set(room);
        const currentUser = this.authService.currentUser();
        const createdBy = room.data.players?.find(
          (p: { isCreated: boolean; userId: number }) => p.isCreated,
        );
        this.isCreator.set(createdBy?.userId === currentUser?.id);
      }
    });
    this.subscriptions.push(roomSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  startRace(roomId: string): void {
    this.socketService.handleCountdown(roomId);
  }

  destroyRace(roomId: string): void {
    this.socketService.handleDestroyRoom(roomId);
    this.roomService.clearSelectRoom();
    this.router.navigate(['homepage']);
  }

  leaveRoom(roomId: string): void {
    this.socketService.handleLeaveRoom(roomId);
  }

  leaveBtnValidation(player: { userId: number; userName: string; isCreated: boolean }): boolean {
    return (
      !player.isCreated &&
      player.userId === this.currentUser?.id &&
      !this.roomDetails()?.data.gameStarted
    );
  }
}
