import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { AvailablePersonsResponse, UserCreateRequest, UserCreateResponse, UserListResponse } from "./user.models";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly http = inject(HttpClient);

  list(page = 1): Observable<UserListResponse> {
    const params = new HttpParams().set("page", page);

    return this.http.get<UserListResponse>(
      "/api/usuarios",
      { params },
    );
  }
  create(payload: UserCreateRequest): Observable<UserCreateResponse> {
    return this.http.post<UserCreateResponse>(
      "/api/usuarios",
      payload,
    );
  }
  availablePersons(
    buscar = "",
    page = 1,
  ): Observable<AvailablePersonsResponse> {
    const params = new HttpParams()
      .set("buscar", buscar.trim())
      .set("page", page);

    return this.http.get<AvailablePersonsResponse>(
      "/api/usuarios/personas-disponibles",
      { params },
    );
  }
}