export interface UserAccessRestrictions {
  id: number;
  access_status: string;
  access_version: number;
  access_security_blocked: boolean;
  access_suspended_until: string | null;
  access_valid_from: string | null;
  access_valid_until: string | null;
}

export type UserAccessRestrictionsUpdate = Pick<
  UserAccessRestrictions,
  | "access_security_blocked"
  | "access_suspended_until"
  | "access_valid_from"
  | "access_valid_until"
  | "access_version"
>;
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { UserAccessOperation, UserAccessResponse } from "./user-access.models";

@Injectable({ providedIn: "root" })
export class UserAccessService {
  private readonly http = inject(HttpClient);

  getRestrictions(userId: number): Observable<UserAccessRestrictions> {
    return this.http.get<UserAccessRestrictions>(
      `/api/usuarios/${userId}/restricciones`,
    );
  }

  updateRestrictions(
    userId: number,
    values: UserAccessRestrictionsUpdate,
  ): Observable<UserAccessRestrictions> {
    return this.http.put<UserAccessRestrictions>(
      `/api/usuarios/${userId}/restricciones`,
      values,
    );
  }
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
