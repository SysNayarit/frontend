import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthContextService } from "./auth-context.service";

function permissionGuard(...permissions: string[]): CanActivateFn {
  return () => {
    const context = inject(AuthContextService);

    const router = inject(Router);

    return context.refresh().pipe(
      map((user) =>
        permissions.every((permission) => user.permissions.includes(permission))
          ? true
          : router.parseUrl("/inicio"),
      ),
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
}

export const personasViewGuard = permissionGuard("personas.ver");

export const personasImportGuard = permissionGuard("personas.importar");

export const usuariosViewGuard = permissionGuard("usuarios.ver");
export const perfilesViewGuard = permissionGuard("perfiles.ver");
export const academicOrganizationViewGuard = permissionGuard("academico.organizacion.ver");
export const credentialQrValidateGuard = permissionGuard("credenciales.validar");
export const credentialManagementGuard = permissionGuard("credenciales.emitir", "personas.ver");
