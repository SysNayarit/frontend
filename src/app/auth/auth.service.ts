import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import {
  AuthenticatedUser,
  LoginCredentials,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<AuthenticatedUser> {
    return this.initializeCsrf().pipe(
      switchMap(() =>
        this.http.post<void>('/login', credentials),
      ),
      switchMap(() => this.currentUser()),
    );
  }

  currentUser(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>('/api/user');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/logout', {});
  }

  reauthenticate(password: string): Observable<void> {
    return this.http.post<void>(
      '/reauthenticate',
      { password },
    );
  }

  private initializeCsrf(): Observable<void> {
    return this.http.get<void>('/sanctum/csrf-cookie');
  }
}
