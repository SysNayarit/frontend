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
    return this.http.get<UserRoleListResponse>("/api/roles");
  }

  listUserRoles(userId: number): Observable<UserRoleListResponse> {
    return this.http.get<UserRoleListResponse>(`/api/usuarios/${userId}/roles`);
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

  assignRolesBulk(
    roleId: number,
    userIds: readonly number[],
  ): Observable<{
    role_id: number;
    result: {
      selected: number;
      assigned: number;
      already_assigned: number;
      assigned_user_ids: number[];
      already_assigned_user_ids: number[];
    };
  }> {
    return this.http.post<{
      role_id: number;
      result: {
        selected: number;
        assigned: number;
        already_assigned: number;
        assigned_user_ids: number[];
        already_assigned_user_ids: number[];
      };
    }>("/api/usuarios/roles/masivo", {
      role_id: roleId,
      user_ids: [...userIds],
    });
  }
  removeRolesBulk(
    roleId: number,
    userIds: readonly number[],
  ): Observable<{
    role_id: number;
    result: {
      selected: number;
      removed: number;
      already_absent: number;
      removed_user_ids: number[];
      already_absent_user_ids: number[];
    };
  }> {
    return this.http.post<{
      role_id: number;
      result: {
        selected: number;
        removed: number;
        already_absent: number;
        removed_user_ids: number[];
        already_absent_user_ids: number[];
      };
    }>("/api/usuarios/roles/retiro-masivo", {
      role_id: roleId,
      user_ids: [...userIds],
    });
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
