import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthContextService } from "./auth-context.service";

export const personasViewGuard: CanActivateFn = () => {
  const context = inject(AuthContextService);

  const router = inject(Router);

  return context.ensureCurrent().pipe(
    map((user) =>
      user.permissions.includes("personas.ver")
        ? true
        : router.parseUrl("/inicio"),
    ),
    catchError(() => of(router.parseUrl("/acceso"))),
  );
};
