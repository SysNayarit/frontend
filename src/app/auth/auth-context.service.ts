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
  private readonly handledEvents = new Set<string>();

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
        !("type" in message) ||
        !("nonce" in message) ||
        typeof message.nonce !== "string" ||
        message.nonce.length === 0 ||
        message.nonce.length > 128 ||
        (message.type !== "logout" && message.type !== "permissions")
      ) {
        return;
      }

      if (this.handledEvents.has(message.nonce)) {
        return;
      }

      // Memoria limitada: evitar acumular eventos indefinidamente.
      if (this.handledEvents.size >= 64) {
        const oldest = this.handledEvents.values().next().value;
        if (oldest !== undefined) {
          this.handledEvents.delete(oldest);
        }
      }
      this.handledEvents.add(message.nonce);

      if (message.type === "logout") {
        // Un mensaje del navegador no demuestra que la sesion
        // actual fue revocada. Confirmarlo contra Laravel.
        const request = this.revalidate();
        const revision = this.revision;

        request.subscribe({
          next: () => {
            // Laravel confirma una sesion vigente: no cerrar.
          },
          error: (error: unknown) => {
            if (
              error instanceof HttpErrorResponse &&
              error.status === 401 &&
              this.revision === revision + 1
            ) {
              void this.router.navigateByUrl(
                "/acceso?estado=sesion-finalizada",
                { replaceUrl: true },
              );
            }
          },
        });
      } else {
        // Nunca aceptar permisos de otra pestana.
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
