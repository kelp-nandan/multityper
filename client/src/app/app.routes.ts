import { Routes } from '@angular/router';
import {Login} from './identity/login/login';
import {Homepage} from './homepage/homepage';

export const routes: Routes = [
    {path:'',component:Login},
    {path:'login',component:Login},
    { path: 'homepage', component: Homepage },
    {path: 'participants', loadComponent: () => import('./gamelobby/gamelobby').then(c => c.Gamelobby)},
    {path:'**', redirectTo:''}
];
