import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { UserRoleService } from "./user-role.service";

describe("UserRoleService", () => {
  let service: UserRoleService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserRoleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("consulta el catalogo de roles", () => {
    const response = {
      data: [
        {
          id: 2,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    };

    let result: typeof response | undefined;

    service.listRoles().subscribe((value) => {
      result = value;
    });

    const request = http.expectOne("/api/roles");

    expect(request.request.method).toBe("GET");

    request.flush(response);

    expect(result).toEqual(response);
  });

  it("consulta los roles asignados a un usuario", () => {
    service.listUserRoles(15).subscribe();

    const request = http.expectOne(
      "/api/usuarios/15/roles",
    );

    expect(request.request.method).toBe("GET");

    request.flush({ data: [] });
  });

  it("asigna un rol enviando solamente role_id", () => {
    service.assignRole(15, 3).subscribe();

    const request = http.expectOne(
      "/api/usuarios/15/roles",
    );

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      role_id: 3,
    });

    request.flush(
      {
        user_id: 15,
        role_id: 3,
        assigned: true,
      },
      {
        status: 201,
        statusText: "Created",
      },
    );
  });

  it("retira un rol mediante DELETE", () => {
    service.removeRole(15, 3).subscribe();

    const request = http.expectOne(
      "/api/usuarios/15/roles/3",
    );

    expect(request.request.method).toBe("DELETE");
    expect(request.request.body).toBeNull();

    request.flush({
      user_id: 15,
      role_id: 3,
      removed: true,
    });
  });

  it("propaga un error HTTP 403", () => {
    let status: number | undefined;

    service.listUserRoles(15).subscribe({
      error: (error: { status: number }) => {
        status = error.status;
      },
    });

    http.expectOne("/api/usuarios/15/roles").flush(
      { message: "Forbidden" },
      {
        status: 403,
        statusText: "Forbidden",
      },
    );

    expect(status).toBe(403);
  });

  it("propaga HTTP 423 cuando falta reautenticacion", () => {
    let status: number | undefined;

    service.assignRole(15, 3).subscribe({
      error: (error: { status: number }) => {
        status = error.status;
      },
    });

    http.expectOne("/api/usuarios/15/roles").flush(
      { message: "Reauthentication required" },
      {
        status: 423,
        statusText: "Locked",
      },
    );

    expect(status).toBe(423);
  });
});