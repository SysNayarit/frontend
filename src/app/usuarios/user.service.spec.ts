import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { UserListResponse } from "./user.models";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("consulta la primera pagina por defecto", () => {
    service.list().subscribe();

    const request = http.expectOne(
      (item) =>
        item.url === "/api/usuarios" &&
        item.params.get("page") === "1",
    );

    expect(request.request.method).toBe("GET");

    request.flush({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
      },
    });
  });

  it("permite consultar otra pagina", () => {
    service.list(3).subscribe();

    const request = http.expectOne(
      (item) =>
        item.url === "/api/usuarios" &&
        item.params.get("page") === "3",
    );

    expect(request.request.method).toBe("GET");

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

  it("devuelve usuarios y metadatos de paginacion", () => {
    const response: UserListResponse = {
      data: [
        {
          id: 10,
          id_persona: null,
          name: "Administrador de prueba",
          email: "administrador@example.test",
          created_at: "2026-10-26T12:00:00Z",
          person: null,
        },
      ],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 1,
      },
    };

    let result: UserListResponse | undefined;

    service.list().subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(
      (item) =>
        item.url === "/api/usuarios" &&
        item.params.get("page") === "1",
    );

    request.flush(response);

    expect(result).toEqual(response);
    expect(result?.data[0]?.person).toBeNull();
    expect(result?.meta.total).toBe(1);
  });

  it("propaga errores de autorizacion del backend", () => {
    let status: number | undefined;

    service.list().subscribe({
      error: (error: { status: number }) => {
        status = error.status;
      },
    });

    const request = http.expectOne(
      (item) => item.url === "/api/usuarios",
    );

    request.flush(
      { message: "Forbidden" },
      {
        status: 403,
        statusText: "Forbidden",
      },
    );

    expect(status).toBe(403);
  });

  it("crea un usuario asociado a una persona registrada", () => {
    const payload = {
      id_persona: "00000000-0000-4000-8000-000000000001",
      email: "nuevo@example.test",
      password: "ClaveSeguraTemporal2026",
      password_confirmation: "ClaveSeguraTemporal2026",
    };

    service.create(payload).subscribe((user) => {
      expect(user.id_persona).toBe(payload.id_persona);
      expect(user.email).toBe(payload.email);
    });

    const request = http.expectOne("/api/usuarios");

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual(payload);

    request.flush({
      id: 15,
      id_persona: payload.id_persona,
      name: "Persona Registrada",
      email: payload.email,
    }, { status: 201, statusText: "Created" });
  });

  it("consulta personas disponibles con busqueda y paginacion", () => {
    service.availablePersons("Maria", 2).subscribe((result) => {
      expect(result.meta.current_page).toBe(2);
      expect(result.data).toEqual([]);
    });

    const request = http.expectOne(
      (item) =>
        item.url === "/api/usuarios/personas-disponibles" &&
        item.params.get("buscar") === "Maria" &&
        item.params.get("page") === "2",
    );

    expect(request.request.method).toBe("GET");

    request.flush({
      data: [],
      meta: {
        current_page: 2,
        last_page: 2,
        per_page: 20,
        total: 21,
      },
    });
  });
});