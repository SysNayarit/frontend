import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import {
  AssignUserRoleResponse,
  RemoveUserRoleResponse,
  UserRoleListResponse,
} from "./user-role.models";

@Injectable({
  providedIn: "root",
})
export class UserRoleService {
  private readonly http = inject(HttpClient);

  listRoles(): Observable<UserRoleListResponse> {
    return this.http.get<UserRoleListResponse>(
      "/api/roles",
    );
  }

  listUserRoles(userId: number): Observable<UserRoleListResponse> {
    return this.http.get<UserRoleListResponse>(
      `/api/usuarios/${userId}/roles`,
    );
  }

  assignRole(
    userId: number,
    roleId: number,
  ): Observable<AssignUserRoleResponse> {
    return this.http.post<AssignUserRoleResponse>(
      `/api/usuarios/${userId}/roles`,
      {
        role_id: roleId,
      },
    );
  }

  removeRole(
    userId: number,
    roleId: number,
  ): Observable<RemoveUserRoleResponse> {
    return this.http.delete<RemoveUserRoleResponse>(
      `/api/usuarios/${userId}/roles/${roleId}`,
    );
  }
}