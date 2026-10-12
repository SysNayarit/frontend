import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { LoginPageComponent } from './auth/login-page.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'acceso',
  },
  {
    path: 'acceso',
    component: LoginPageComponent,
  },
  {
    path: 'inicio',
    component: HomeComponent,
    canActivate: [
      authGuard,
    ],
  },
  {
    path: '**',
    redirectTo: 'acceso',
  },
];
