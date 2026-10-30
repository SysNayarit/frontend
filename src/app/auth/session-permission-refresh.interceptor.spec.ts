import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";

import { AuthContextService } from "./auth-context.service";
import { AuthService } from "./auth.service";
import { sessionRevocationInterceptor } from "./session-revocation.interceptor";

describe("Actualizacion de permisos tras HTTP 403", () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let context: AuthContextService;
  let navigations: string[];

  beforeEach(() => {
    navigations = [];

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([sessionRevocationInterceptor]),
        ),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: () =>
              TestBed.inject(HttpClient).get("/api/user"),
          },
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigations.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    context = TestBed.inject(AuthContextService);
  });

  afterEach(() => {
    requests.verify();
  });

  it("actualiza permisos despues de una denegacion sin cerrar sesion", () => {
    context.refresh().subscribe();

    requests.expectOne("/api/user").flush({
      id: 12,
      permissions: ["usuarios.asignar_roles"],
    });

    expect(context.hasPermission("usuarios.asignar_roles")).toBe(true);

    let status = 0;

    http.post("/api/usuarios/roles/masivo", {
      role_id: 2,
      user_ids: [12],
    }).subscribe({
      error: (error: HttpErrorResponse) => {
        status = error.status;
      },
    });

    requests.expectOne("/api/usuarios/roles/masivo").flush(
      { message: "Prohibido" },
      { status: 403, statusText: "Forbidden" },
    );

    requests.expectOne("/api/user").flush({
      id: 12,
      permissions: [],
    });

    expect(status).toBe(403);
    expect(context.hasPermission("usuarios.asignar_roles")).toBe(false);
    expect(context.user()).not.toBeNull();
    expect(navigations).toEqual([]);
  });

  it("no provoca recargas recursivas cuando API user devuelve 403", () => {
    let status = 0;

    context.refresh().subscribe({
      error: (error: HttpErrorResponse) => {
        status = error.status;
      },
    });

    requests.expectOne("/api/user").flush(
      { message: "Prohibido" },
      { status: 403, statusText: "Forbidden" },
    );

    expect(status).toBe(403);
    expect(navigations).toEqual([]);
  });
});