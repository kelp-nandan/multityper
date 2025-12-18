import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { Observable, Subscription, interval } from 'rxjs';
import { environment } from '../../environments/environment';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private tokenCheckSubscription?: Subscription;
  private authCheckCompleted = false;
  private authCheckPromise?: Promise<void>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.startTokenExpiryCheck();
    }
  }

  async waitForAuthCheck(): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    if (this.authCheckCompleted) {
      return this.isAuthenticated();
    }

    if (this.authCheckPromise) {
      await this.authCheckPromise;
      return this.isAuthenticated();
    }

    this.authCheckPromise = this.loadUserFromStorage();
    await this.authCheckPromise;
    this.authCheckCompleted = true;
    return this.isAuthenticated();
  }

  private loadUserFromStorage(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    return new Promise((resolve) => {
      this.getUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data.user) {
            this.currentUser.set(response.data.user);
            this.isAuthenticated.set(true);
          } else {
            this.currentUser.set(null);
            this.isAuthenticated.set(false);
          }
          resolve();
        },
        error: () => {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          resolve();
        }
      });
    });
  }

  private hashPassword(password: string): string {
    // Apply SHA-256 hashing to match backend expectation
    return CryptoJS.SHA256(password).toString();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    // Hash password on client-side to prevent plain text transmission
    const hashedPassword = this.hashPassword(password);
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password: hashedPassword },
      { withCredentials: true }
    );
  }

  register(userData: any): Observable<AuthResponse> {
    // Hash password on client-side to prevent plain text transmission
    const hashedPassword = this.hashPassword(userData.password);
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      { ...userData, password: hashedPassword },
      { withCredentials: true }
    );
  }

  setUserData(user: User) {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  getUserProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(
      `${this.apiUrl}/profile`,
      { withCredentials: true }
    );
  }

  async logout() {
    if (!this.isBrowser) return;

    try {
      await this.http.post(
        `${this.apiUrl}/logout`,
        {},
        { withCredentials: true }
      ).toPromise();
    } catch (error) {
      // Logout failed but continue with local cleanup
    }

    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.authCheckCompleted = false;
    this.authCheckPromise = undefined;
    this.tokenCheckSubscription?.unsubscribe();
    this.router.navigate(['/login']);
  }

  private startTokenExpiryCheck() {
    this.tokenCheckSubscription = interval(5 * 60000).subscribe(async () => {
      if (this.isAuthenticated()) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.logout();
        }
      }
    });
  }

  async refreshToken(): Promise<boolean> {
    if (!this.isBrowser) return false;

    try {
      const response = await this.http.post<AuthResponse>(
        `${this.apiUrl}/refresh`,
        {},
        { withCredentials: true }
      ).toPromise();

      return response?.success || false;
    } catch (error) {
      return false;
    }
  }
}