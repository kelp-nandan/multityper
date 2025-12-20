import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Room } from '../interfaces/room.interface';
import { AuthService } from '../services/auth.service';
import { RoomService } from '../services/room.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-gamelobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gamelobby.html',
  styleUrls: ['./gamelobby.scss'],
})
export class Gamelobby implements OnInit {
  room$!: Observable<Room | null>;
  isCreator = signal<boolean>(false);

  constructor(
    private roomService: RoomService, 
    private authService : AuthService, 
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.room$ = this.roomService.selectedRoom$;
    
    this.roomService.selectedRoom$.subscribe((room) => {
      if (room) {
        const currentUser = this.authService.currentUser();
        const creatorPlayer = room.players?.find((p) => p.isCreated);
        this.isCreator.set(
          creatorPlayer?.userName === currentUser?.name
        );
      } else {
        this.router.navigate(['/homepage']);
      }
    });
  }

  startRace(roomId: string) {
    console.log("Race Started...Countdown part");
    this.socketService.handleCountdown(roomId);
  }

  destroyRace(roomId: string) {
    this.socketService.handleDestroyRoom(roomId);  
    this.roomService.clearSelectRoom();
    this.router.navigate(['homepage']);
  }
}

