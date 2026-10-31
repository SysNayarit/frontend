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
import { provideRouter, Router } from "@angular/router";

import { UserAccessService } from "../usuarios/user-access.service";
import { AuthContextService } from "./auth-context.service";
import { sessionRevocationInterceptor } from "./session-revocation.interceptor";

describe("Integracion HTTP de control de acceso SIGA", () => {
  let http: HttpTestingController;
  let context: AuthContextService;
  let access: UserAccessService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([sessionRevocationInterceptor]),
        ),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    context = TestBed.inject(AuthContextService);
    access = TestBed.inject(UserAccessService);

    navigate = vi
      .spyOn(TestBed.inject(Router), "navigateByUrl")
      .mockResolvedValue(true);

    context.refresh().subscribe();

    http.expectOne("/api/user").flush({
      id: 1,
      name: "Responsable de prueba",
      permissions: [
        "usuarios.habilitar",
        "usuarios.deshabilitar",
      ],
    });

    expect(context.hasPermission("usuarios.habilitar")).toBe(true);
  });

  afterEach(() => {
    http.verify();
  });

  for (const caso of [
    { operation: "enable" as const, endpoint: "habilitar" },
    { operation: "disable" as const, endpoint: "deshabilitar" },
  ]) {
    it(`revoca contexto ante 401 al ${caso.endpoint}`, () => {
      let captured: unknown = null;

      access.change(25, caso.operation).subscribe({
        error: (error: unknown) => {
          captured = error;
        },
      });

      const url = `/api/usuarios/25/${caso.endpoint}`;
      const request = http.expectOne(url);

      expect(request.request.method).toBe("POST");

      request.flush(
        { code: "ACCESS_REVOKED" },
        { status: 401, statusText: "Unauthorized" },
      );

      expect(captured).toBeInstanceOf(HttpErrorResponse);
      expect(context.user()).toBeNull();
      expect(context.hasPermission("usuarios.habilitar")).toBe(false);

      expect(navigate).toHaveBeenCalledWith(
        "/acceso?estado=sesion-finalizada",
        { replaceUrl: true },
      );

      http.expectNone(url);
    });
  }

  for (const caso of [
    { status: 403, code: "FORBIDDEN" },
    { status: 409, code: "LAST_ENABLED_ADMIN" },
    { status: 422, code: "VALIDATION_ERROR" },
    { status: 423, code: "" },
    { status: 429, code: "RATE_LIMITED" },
    { status: 503, code: "SERVICE_UNAVAILABLE" },
  ]) {
    it(`conserva sesion ante HTTP ${caso.status}`, () => {
      let captured: unknown = null;

      access.change(25, "enable").subscribe({
        error: (error: unknown) => {
          captured = error;
        },
      });

      const url = "/api/usuarios/25/habilitar";
      const request = http.expectOne(url);

      expect(request.request.body).toEqual({
        roles_revisados: true,
      });

      request.flush(
        {
          code: caso.code,
          message:
            caso.status === 423
              ? "Reauthentication required."
              : "Operacion rechazada.",
        },
        {
          status: caso.status,
          statusText: "Rejected",
        },
      );

      if (caso.status === 403) {
        const refresh = http.expectOne("/api/user");

        expect(refresh.request.method).toBe("GET");

        refresh.flush({
          id: 1,
          name: "Responsable de prueba",
          permissions: ["usuarios.deshabilitar"],
        });
      }

      expect(captured).toBeInstanceOf(HttpErrorResponse);
      expect((captured as HttpErrorResponse).status).toBe(caso.status);

      expect(context.hasPermission("usuarios.habilitar")).toBe(
        caso.status !== 403,
      );
      expect(context.hasPermission("usuarios.deshabilitar")).toBe(true);
      expect(context.user()).not.toBeNull();
      expect(navigate).not.toHaveBeenCalled();

      http.expectNone(url);
    });
  }

  it("habilita solo con respuesta confirmada por backend", () => {
    let confirmed = "";

    access.change(25, "enable").subscribe({
      next: (response) => {
        confirmed = response.access_status;
      },
    });

    const request = http.expectOne("/api/usuarios/25/habilitar");

    expect(request.request.body).toEqual({
      roles_revisados: true,
    });

    request.flush({
      id: 25,
      id_persona: "persona-prueba-25",
      access_status: "HABILITADO",
      access_version: 3,
    });

    expect(confirmed).toBe("HABILITADO");
    expect(context.user()).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("deshabilita sin enviar revision de roles", () => {
    let confirmed = "";

    access.change(25, "disable").subscribe({
      next: (response) => {
        confirmed = response.access_status;
      },
    });

    const request = http.expectOne("/api/usuarios/25/deshabilitar");

    expect(request.request.body).toEqual({});

    request.flush({
      id: 25,
      id_persona: "persona-prueba-25",
      access_status: "DESHABILITADO",
      access_version: 4,
    });

    expect(confirmed).toBe("DESHABILITADO");
    expect(context.user()).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("rechaza confirmacion inconsistente sin alterar la sesion", () => {
    let captured: unknown = null;

    access.change(25, "enable").subscribe({
      error: (error: unknown) => {
        captured = error;
      },
    });

    http.expectOne("/api/usuarios/25/habilitar").flush({
      id: 25,
      id_persona: "persona-prueba-25",
      access_status: "HABILITADO",
      access_version: 0,
    });

    expect(captured).toBeInstanceOf(Error);
    expect(context.hasPermission("usuarios.habilitar")).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});