import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { ProfileListResponse } from "./profile.models";

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  private readonly http = inject(HttpClient);

  getProfiles(): Observable<ProfileListResponse> {
    return this.http.get<ProfileListResponse>("/api/user/profiles");
  }
}
