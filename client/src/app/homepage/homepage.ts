import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { IRoom } from '../interfaces/room.interface';
import { Modal } from '../modal/modal';
import { AuthService } from '../services/auth.service';
import { RoomService } from '../services/room.service';
import { SocketService } from '../services/socket.service';

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
  styleUrls: ['./homepage.scss'],
})

export class Homepage implements OnInit {

  rooms$!: Observable<IRoom[]>;

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

  trackByRoomId(index: number, room: IRoom) {
    return room.roomId;
  }


  joinRoomModal() {
    this.showJoinModal.set(true);
  }

  createRoomModal() {
    this.showCreateModal.set(true);
  }

  handleJoinClose() {
    this.showJoinModal.set(false);
  }

  handleCreateClose() {
    this.showCreateModal.set(false);
  }

  handleCreateConfirm() {
    this.socketService.handleCreateRoom({ roomName: this.roomName() });
    this.showCreateModal.set(false);
    this.router.navigate(['/participants']);
    this.roomName.set('');
  }

  handleJoinRoom(room: IRoom) {
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
