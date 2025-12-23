import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { Observable, Subscription, interval } from 'rxjs';
import { HttpService } from '../../services/http.service';
import { IUser, IAuthResponse, IRegisterRequest } from '../../interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<IUser | null>(null);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private tokenCheckSubscription?: Subscription;

  // Computed signal to derive authentication state
  isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(
    private httpService: HttpService,
    private router: Router,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.startTokenExpiryCheck();
    }
  }

  async waitForAuthCheck(): Promise<boolean> {
    if (!this.isBrowser) return false;

    // If we already have user data, return true immediately
    if (this.currentUser() !== null) {
      return true;
    }

    // Check if user is authenticated with timeout
    try {
      const response = (await Promise.race([
        this.httpService.getUserProfile().toPromise(),
        new Promise<IAuthResponse>((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), 2000),
        ),
      ])) as IAuthResponse;

      if (response?.data?.user) {
        // Handle Sequelize objects by extracting dataValues if present
        const cleanUser = (response.data.user as any)?.dataValues || response.data.user;
        this.currentUser.set(cleanUser);
        return true;
      }
    } catch (error) {
      // Clear user state on auth failure or timeout
      this.currentUser.set(null);
    }

    return false;
  }

  private encryptPassword(password: string): string {
    // Hash password using SHA-256
    return CryptoJS.SHA256(password).toString();
  }

  login(email: string, password: string): Observable<IAuthResponse> {
    // Hash password client-side
    const hashedPassword = this.encryptPassword(password);
    return this.httpService.login({ email, password: hashedPassword });
  }

  register(userData: IRegisterRequest): Observable<IAuthResponse> {
    // Hash password client-side
    const hashedPassword = this.encryptPassword(userData.password);
    return this.httpService.register({
      ...userData,
      password: hashedPassword,
    });
  }

  setUserData(user: IUser) {
    // Handle Sequelize objects by extracting dataValues if present
    const cleanUser = (user as any)?.dataValues || user;
    this.currentUser.set(cleanUser);
  }

  getUserProfile(): Observable<IAuthResponse> {
    return this.httpService.getUserProfile();
  }

  async logout() {
    if (!this.isBrowser) return;

    try {
      await this.httpService.logout().toPromise();
    } catch (error) {
      // Logout failed but continue with local cleanup
    }

    this.currentUser.set(null);
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
      const response = await this.httpService.refreshToken().toPromise();
      // If we reach here, refresh was successful (200 status)
      return true;
    } catch (error: unknown) {
      // Refresh failed - token expired or network error
      return false;
    }
  }
}
