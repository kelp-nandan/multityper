import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Modal } from '../modal/modal';
import { AuthService } from '../services/auth.service';
import { SocketService } from '../services/socket.service';
import { Room } from '../interfaces/room.interface';
import { RoomService } from '../services/room.service';
import { Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}


@Component({
  selector: 'app-homepage',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Homepage implements OnInit {

  rooms$!: Observable<Room[]>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService,
    private roomService: RoomService
  ) {
    this.rooms$ = this.roomService.rooms$;
  }

  user = signal<User | null>(null);
  showDetails = signal(false);
  isLoading = signal(false);
  showJoinModal = signal(false);
  showCreateModal = signal(false);
  roomName = signal<string>('');

  

  ngOnInit() {
    this.socketService.handleTesting();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user.set(currentUser);
    } else {
      this.fetchUserProfile();
    }
  }

  joinRoomModal() {
    this.showJoinModal.set(true);
  }

  createRoomModal() {
    this.showCreateModal.set(true);
  }

  handleCreateConfirm() {
    console.log('Creating new room');
    this.socketService.handleCreateRoom({ roomName: this.roomName() });
    this.showCreateModal.set(false);
    this.roomName.set('');
    this.router.navigate(['/participants']);
  }

  handleJoinClose() {
    this.showJoinModal.set(false);

  }

  handleCreateClose() {
    this.showCreateModal.set(false);
  }

  handleJoinRoom(room: Room) {
    console.log('Entering room with ID:', room.roomId);
    this.roomService.selectRoom(room);
    this.showJoinModal.set(false);
    this.socketService.handleJoinRoom(room.roomId);
    this.router.navigate(['/participants']);
  }


  fetchUserProfile() {
    this.isLoading.set(true);
    this.authService.getUserProfile().subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success && response.data.user) {
          this.user.set(response.data.user);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error fetching user profile:', error);
        this.authService.logout();
      }
    });
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?'))
      this.authService.logout();
  }

}
