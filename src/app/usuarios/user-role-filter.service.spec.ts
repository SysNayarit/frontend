import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";

import { UserService } from "./user.service";

describe("UserService - filtro de usuarios por rol", () => {
  function configure() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), UserService],
    });

    return {
      service: TestBed.inject(UserService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it("mantiene el listado general sin filtro de rol", () => {
    const { service, http } = configure();

    service.list(2).subscribe();

    const request = http.expectOne((req) => req.url === "/api/usuarios");

    expect(request.request.method).toBe("GET");
    expect(request.request.params.get("page")).toBe("2");
    expect(request.request.params.has("role_id")).toBe(false);

    request.flush({
      data: [],
      meta: {
        current_page: 2,
        last_page: 2,
        per_page: 20,
        total: 25,
      },
    });
  });

  it("envia el filtro de rol antes de paginar", () => {
    const { service, http } = configure();

    service.list(3, 7).subscribe();

    const request = http.expectOne((req) => req.url === "/api/usuarios");

    expect(request.request.method).toBe("GET");
    expect(request.request.params.get("page")).toBe("3");
    expect(request.request.params.get("role_id")).toBe("7");

    request.flush({
      data: [],
      meta: {
        current_page: 3,
        last_page: 3,
        per_page: 20,
        total: 45,
      },
    });
  });
});
