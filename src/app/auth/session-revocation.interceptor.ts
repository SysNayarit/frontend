import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthContextService } from "./auth-context.service";

export const sessionRevocationInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const context = inject(AuthContextService);
  const router = inject(Router);
  const revision = context.revision;
  const protectedRequest =
    request.url.startsWith("/api/") ||
    request.url === "/reauthenticate" ||
    request.url === "/logout";
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        protectedRequest &&
        revision === context.revision &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        context.clear();
        void router.navigateByUrl("/acceso?estado=sesion-finalizada", {
          replaceUrl: true,
        });
      }
      // Las mutaciones nunca se repiten automáticamente.
      return throwError(() => error);
    }),
  );
};
