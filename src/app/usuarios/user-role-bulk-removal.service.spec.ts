import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { afterEach, describe, expect, it } from "vitest";

import { UserRoleService } from "./user-role.service";

describe("UserRoleService - retirada masiva", () => {
  function configure() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserRoleService,
      ],
    });

    return {
      service: TestBed.inject(UserRoleService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it("envia el rol y los usuarios al endpoint de retirada masiva", () => {
    const { service, http } = configure();

    const response = {
      role_id: 3,
      result: {
        selected: 3,
        removed: 2,
        already_absent: 1,
        removed_user_ids: [12, 15],
        already_absent_user_ids: [18],
      },
    };

    let received: typeof response | undefined;

    service.removeRolesBulk(3, [12, 15, 18]).subscribe((result) => {
      received = result;
    });

    const request = http.expectOne("/api/usuarios/roles/retiro-masivo");

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      role_id: 3,
      user_ids: [12, 15, 18],
    });

    request.flush(response);

    expect(received).toEqual(response);
  });

  it("conserva los identificadores originales del lote", () => {
    const { service, http } = configure();

    const selectedIds = [12, 15];

    service.removeRolesBulk(3, selectedIds).subscribe();

    const request = http.expectOne("/api/usuarios/roles/retiro-masivo");

    expect(request.request.body.user_ids).toEqual([12, 15]);
    expect(selectedIds).toEqual([12, 15]);
    expect(request.request.body.user_ids).not.toBe(selectedIds);

    request.flush({
      role_id: 3,
      result: {
        selected: 2,
        removed: 2,
        already_absent: 0,
        removed_user_ids: [12, 15],
        already_absent_user_ids: [],
      },
    });
  });
});
