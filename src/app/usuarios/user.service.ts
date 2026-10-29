import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import {
  AvailablePersonsResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserListResponse,
} from "./user.models";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly http = inject(HttpClient);

  list(page = 1, roleId?: number): Observable<UserListResponse> {
    let params = new HttpParams().set("page", page);

    if (roleId !== undefined) {
      params = params.set("role_id", roleId);
    }

    return this.http.get<UserListResponse>("/api/usuarios", { params });
  }
  create(payload: UserCreateRequest): Observable<UserCreateResponse> {
    return this.http.post<UserCreateResponse>("/api/usuarios", payload);
  }
  availablePersons(
    buscar = "",
    page = 1,
    filters: {
      persona?: string;
      expediente?: string;
      fecha_registro?: string;
      forma_registro?: "INDIVIDUAL" | "MASIVO" | "NO_DETERMINADO" | "";
    } = {},
  ): Observable<AvailablePersonsResponse> {
    let params = new HttpParams()
      .set("buscar", buscar.trim())
      .set("page", page);

    for (const [key, value] of Object.entries(filters)) {
      if (value?.trim()) {
        params = params.set(key, value.trim());
      }
    }

    return this.http.get<AvailablePersonsResponse>(
      "/api/usuarios/personas-disponibles",
      { params },
    );
  }
}
