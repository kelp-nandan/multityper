import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiresAuth = route.data?.['requiresAuth'] !== false; // Default to true

  try {
    const isAuthenticated = await Promise.race([
      authService.waitForAuthCheck(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000),
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
      router.navigate(['/homepage']);
      return false;
    }
  } catch (error) {
    // Handle timeout or other errors
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
