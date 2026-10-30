import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { UserAccessOperation, UserAccessResponse } from "./user-access.models";

@Injectable({ providedIn: "root" })
export class UserAccessService {
  private readonly http = inject(HttpClient);

  change(
    userId: number,
    operation: UserAccessOperation,
  ): Observable<UserAccessResponse> {
    const action = operation === "enable" ? "habilitar" : "deshabilitar";
    return this.http
      .post<UserAccessResponse>(
        `/api/usuarios/${userId}/${action}`,
        operation === "enable" ? { roles_revisados: true } : {},
      )
      .pipe(
        map((response) => {
          const expected =
            operation === "enable" ? "HABILITADO" : "DESHABILITADO";
          if (
            response.id !== userId ||
            response.access_status !== expected ||
            !Number.isInteger(response.access_version) ||
            response.access_version < 1
          ) {
            throw new Error(
              "No fue posible verificar el estado confirmado de la cuenta.",
            );
          }
          return response;
        }),
      );
  }
}
