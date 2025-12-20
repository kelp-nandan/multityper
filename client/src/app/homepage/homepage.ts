import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../identity/services/auth.service';
import { IUser } from '../interfaces/auth.interfaces';

@Component({
  selector: 'app-homepage',
  imports: [CommonModule],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
})
export class Homepage implements OnInit {
  user = signal<IUser | null>(null);
  showDetails = signal(false);
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.user.set(this.authService.currentUser());
  }

  toggleDetails() {
    this.showDetails.set(!this.showDetails());
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?')) this.authService.logout();
  }

  startGame() {
    this.router.navigate(['/game-dashboard']);
  }
}
