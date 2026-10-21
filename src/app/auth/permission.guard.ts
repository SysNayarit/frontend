import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthContextService } from "./auth-context.service";

function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const context = inject(AuthContextService);

    const router = inject(Router);

    return context.ensureCurrent().pipe(
      map((user) =>
        user.permissions.includes(permission)
          ? true
          : router.parseUrl("/inicio"),
      ),
      catchError(() => of(router.parseUrl("/acceso"))),
    );
  };
}

export const personasViewGuard = permissionGuard("personas.ver");

export const personasImportGuard = permissionGuard("personas.importar");
