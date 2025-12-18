import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}


@Component({
  selector: 'app-homepage',
  imports: [CommonModule],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css'],
})

export class Homepage implements OnInit {
  user = signal<User | null>(null);
  showDetails = signal(false);
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user.set(this.authService.currentUser());
  }


  toggleDetails() {
    this.showDetails.set(!this.showDetails());
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?'))
      this.authService.logout();
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

}
