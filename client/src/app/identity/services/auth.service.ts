import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { Observable, Subscription, interval } from 'rxjs';
import { PROFILE_CHECK_TIMEOUT, TOKEN_CHECK_INTERVAL } from '../../constants';
import { IAuthResponse, IRegisterRequest, IUser } from '../../interfaces/auth.interfaces';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<IUser | null>(null);
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private tokenCheckSubscription?: Subscription;

  // Computed signal to derive authentication state
  isAuthenticated = computed(() => this.currentUser() !== null);

  private readonly httpService = inject(HttpService);
  private readonly router = inject(Router);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.startTokenExpiryCheck();
    }
  }

  async waitForAuthCheck(): Promise<boolean> {
    if (!this.isBrowser) return false;

    // already logged in? cool
    if (this.currentUser() !== null) {
      return true;
    }

    // check auth with timeout
    try {
      const response = (await Promise.race([
        this.httpService.getUserProfile().toPromise(),
        new Promise<IAuthResponse>((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), PROFILE_CHECK_TIMEOUT),
        ),
      ])) as IAuthResponse;

      if (response?.data?.user) {
        const cleanUser = response.data.user;
        this.currentUser.set(cleanUser);
        return true;
      }
    } catch {
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

  setUserData(user: IUser): void {
    const cleanUser = user;
    this.currentUser.set(cleanUser);
  }

  getUserProfile(): Observable<IAuthResponse> {
    return this.httpService.getUserProfile();
  }

  async logout() {
    if (!this.isBrowser) return;

    try {
      await this.httpService.logout().toPromise();
    } catch {
      // Logout failed but continue with local cleanup
    }

    this.currentUser.set(null);
    this.tokenCheckSubscription?.unsubscribe();
    this.router.navigate(['/login']);
  }

  private startTokenExpiryCheck(): void {
    this.tokenCheckSubscription = interval(TOKEN_CHECK_INTERVAL).subscribe(async () => {
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
    } catch {
      // Refresh failed - token expired or network error
      return false;
    }
  }
}
