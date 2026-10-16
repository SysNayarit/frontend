import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthContextService } from "./auth-context.service";

export const authGuard: CanActivateFn = () => {
  const context = inject(AuthContextService);

  const router = inject(Router);

  return context.refresh().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl("/acceso"))),
  );
};
