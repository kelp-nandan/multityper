import { Routes } from '@angular/router';
import {Login} from './identity/login/login';
import {Homepage} from './homepage/homepage';
import { authGuard } from './identity/guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    component: Login
  },
  {
    path:'login',
    canActivate: [authGuard],
    component: Login,
    data: { requiresAuth: false}
  },
  { 
    path: 'homepage',
    canActivate: [authGuard],
    component: Homepage,
    data: { requiresAuth: true}
  },
  {
    path: 'participants',
    canActivate: [authGuard],
    loadComponent: () => import('./gamelobby/gamelobby').then(c => c.Gamelobby),
    data: { requiresAuth: true}
  },
  {
    path:'**', 
    redirectTo:''
  }
];
