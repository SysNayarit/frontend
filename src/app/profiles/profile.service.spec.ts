import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { ProfileListResponse } from "./profile.models";
import { ProfileService } from "./profile.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("obtiene los perfiles asignados al usuario autenticado", () => {
    const backendResponse: ProfileListResponse = {
      data: [
        {
          id: 1,
          name: "Personas",
          code: "PERFIL_PERSONAS",
          is_default: true,
        },
        {
          id: 2,
          name: "Auditoria",
          code: "PERFIL_AUDITORIA",
          is_default: false,
        },
      ],
    };

    let result: ProfileListResponse | undefined;

    service.getProfiles().subscribe((response) => {
      result = response;
    });

    const request = http.expectOne("/api/user/profiles");

    expect(request.request.method).toBe("GET");

    request.flush(backendResponse);

    expect(result).toEqual(backendResponse);
  });
});
