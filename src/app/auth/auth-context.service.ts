import { HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import {
  catchError,
  finalize,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from "rxjs";

import { AuthenticatedUser } from "./auth.models";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthContextService {
  private readonly auth = inject(AuthService);

  private readonly currentUserState = signal<AuthenticatedUser | null>(null);

  private inFlight: Observable<AuthenticatedUser> | null = null;

  readonly user = this.currentUserState.asReadonly();

  refresh(): Observable<AuthenticatedUser> {
    if (this.inFlight !== null) {
      return this.inFlight;
    }

    let request: Observable<AuthenticatedUser>;

    request = this.auth.currentUser().pipe(
      tap((user) => {
        this.currentUserState.set(user);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clear();
        }

        return throwError(() => error);
      }),
      finalize(() => {
        if (this.inFlight === request) {
          this.inFlight = null;
        }
      }),
      shareReplay({
        bufferSize: 1,
        refCount: false,
      }),
    );

    this.inFlight = request;

    return request;
  }

  ensureCurrent(): Observable<AuthenticatedUser> {
    const current = this.currentUserState();

    if (current !== null) {
      return of(current);
    }

    return this.refresh();
  }

  hasPermission(permission: string): boolean {
    return this.currentUserState()?.permissions.includes(permission) ?? false;
  }

  clear(): void {
    this.currentUserState.set(null);
  }
}
