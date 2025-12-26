import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTH_CHECK_TIMEOUT } from '../../constants';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiresAuth = route.data?.['requiresAuth'] !== false; // Default to true

  try {
    const isAuthenticated = await Promise.race([
      authService.waitForAuthCheck(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT),
      ),
    ]);

    if (requiresAuth) {
      // Protected route - requires authentication
      if (isAuthenticated) {
        return true;
      }
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    } else {
      // Guest route - requires NO authentication
      if (!isAuthenticated) {
        return true;
      }
      return false;
    }
  } catch {
    // something went wrong
    if (requiresAuth) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    } else {
      return true; // Allow guest access on auth check failure
    }
  }
};
