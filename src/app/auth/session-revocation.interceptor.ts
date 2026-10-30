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
        error instanceof HttpErrorResponse
      ) {
        if (error.status === 401) {
          context.clear();
          void router.navigateByUrl("/acceso?estado=sesion-finalizada", {
            replaceUrl: true,
          });
        } else if (error.status === 403 && request.url !== "/api/user") {
          // Revalidar permisos sin repetir la operacion rechazada.
          context.refresh().subscribe({
            error: () => {
              // Conservar el error HTTP original.
            },
          });
        }
      }
      // Las mutaciones nunca se repiten automáticamente.
      return throwError(() => error);
    }),
  );
};
