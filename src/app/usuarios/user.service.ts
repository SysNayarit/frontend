import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { UserListResponse } from "./user.models";

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
}