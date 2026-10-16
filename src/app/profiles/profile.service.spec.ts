import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { ProfileListResponse, ProfileResponse } from "./profile.models";
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

  it("obtiene los perfiles asignados con su grupo de trabajo", () => {
    const backendResponse: ProfileListResponse = {
      data: [
        {
          id: 1,
          name: "Personas",
          code: "PERFIL_PERSONAS",
          is_default: true,
          group: {
            id: 1,
            name: "Operación",
            code: "GRUPO_OPERACION",
            sort_order: 10,
          },
        },
        {
          id: 2,
          name: "Auditoria",
          code: "PERFIL_AUDITORIA",
          is_default: false,
          group: {
            id: 2,
            name: "Control y supervisión",
            code: "GRUPO_CONTROL_SUPERVISION",
            sort_order: 20,
          },
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

  it("establece un perfil asignado como predeterminado y recibe su grupo", () => {
    const backendResponse: ProfileResponse = {
      data: {
        id: 2,
        name: "Auditoria",
        code: "PERFIL_AUDITORIA",
        is_default: true,
        group: {
          id: 2,
          name: "Control y supervisión",
          code: "GRUPO_CONTROL_SUPERVISION",
          sort_order: 20,
        },
      },
    };

    let result: ProfileResponse | undefined;

    service.setDefaultProfile(2).subscribe((response) => {
      result = response;
    });

    const request = http.expectOne("/api/user/profiles/2/default");

    expect(request.request.method).toBe("PUT");
    expect(request.request.body).toEqual({});

    request.flush(backendResponse);

    expect(result).toEqual(backendResponse);
  });
});
