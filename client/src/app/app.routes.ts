import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Homepage } from './homepage/homepage';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/homepage',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login,
        canActivate: [guestGuard]
    },
    {
        path: 'homepage',
        component: Homepage,
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '/homepage' }
];
