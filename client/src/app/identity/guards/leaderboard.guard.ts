import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTH_CHECK_TIMEOUT } from '../../constants';
import { RoomService } from '../../services/room.service';
import { AuthService } from '../services/auth.service';

export const leaderboardGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roomService = inject(RoomService);

  const requiresAuth = route.data?.['requiresAuth'] !== false; // Default to true

  try {
    const isAuthenticated = await Promise.race([
      authService.waitForAuthCheck(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT),
      ),
    ]);

    if (!isAuthenticated) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    const roomExists = roomService.getCurrentRoom();
    if (!roomExists) {
      router.navigate(['/homepage']);
      return false;
    } else {
      return true;
    }
  } catch {
    // something went wrong
    if (requiresAuth) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    } else {
      return true;
    }
  }
};
