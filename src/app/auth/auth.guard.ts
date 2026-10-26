import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthContextService } from "./auth-context.service";

export const authGuard: CanActivateFn = () => {
  const context = inject(AuthContextService);

  const router = inject(Router);

  return context.refresh().pipe(
    map(() => true),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          return of(router.parseUrl("/acceso"));
        }

        if (error.status === 403) {
          return of(router.parseUrl("/estado-acceso?tipo=permisos"));
        }
      }

      return of(router.parseUrl("/estado-acceso?tipo=temporal"));
    }),
  );
};
