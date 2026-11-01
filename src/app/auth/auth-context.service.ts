import { HttpErrorResponse } from "@angular/common/http";
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import {
  catchError,
  finalize,
  Observable,
  of,
  shareReplay,
  filter,
  tap,
  throwError,
} from "rxjs";

import { Router } from "@angular/router";
import { AuthenticatedUser } from "./auth.models";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthContextService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUserState = signal<AuthenticatedUser | null>(null);

  private readonly tabSyncKey = "siga:auth:cross-tab";

  constructor() {
    if (typeof window === "undefined") {
      return;
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key !== this.tabSyncKey || event.newValue === null) {
        return;
      }

      let message: unknown;

      try {
        message = JSON.parse(event.newValue);
      } catch {
        return;
      }

      if (
        typeof message !== "object" ||
        message === null ||
        !("type" in message)
      ) {
        return;
      }

      if (message.type === "logout") {
        this.clear();
        void this.router.navigateByUrl(
          "/acceso?estado=sesion-finalizada",
          { replaceUrl: true },
        );
      } else if (message.type === "permissions") {
        // Consultar siempre a Laravel; no confiar en permisos
        // ni identidades transmitidas por otra pestana.
        this.revalidate().subscribe({
          error: () => undefined,
        });
      }
    };

    window.addEventListener("storage", onStorage);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener("storage", onStorage);
    });
  }

  notifyOtherTabs(type: "logout" | "permissions"): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // El mensaje no contiene credenciales, sesiones,
      // identidades ni permisos del usuario.
      window.localStorage.setItem(
        this.tabSyncKey,
        JSON.stringify({
          type,
          nonce: `${Date.now()}-${Math.random()}`,
        }),
      );
      window.localStorage.removeItem(this.tabSyncKey);
    } catch {
      // El control de acceso efectivo permanece en Laravel.
    }
  }

  private generation = 0;

  private inFlight: Observable<AuthenticatedUser> | null = null;

  readonly user = this.currentUserState.asReadonly();

  get revision(): number { return this.generation; }

  refresh(): Observable<AuthenticatedUser> {
    if (this.inFlight !== null) {
      return this.inFlight;
    }

    const generation = this.generation;
    let request: Observable<AuthenticatedUser>;

    request = this.auth.currentUser().pipe(
      filter(() => generation === this.generation),
      tap((user) => this.currentUserState.set(user)),
      catchError((error: unknown) => {
        if (generation === this.generation && error instanceof HttpErrorResponse && error.status === 401) {
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

  revalidate(): Observable<AuthenticatedUser> {
    // La denegacion del servidor invalida las respuestas anteriores.
    // No equivale a cerrar la sesion ni a repetir la mutacion.
    this.generation++;
    this.inFlight = null;
    this.currentUserState.set(null);
    return this.refresh();
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
    this.generation++;
    this.inFlight = null;
    this.currentUserState.set(null);
  }
}
