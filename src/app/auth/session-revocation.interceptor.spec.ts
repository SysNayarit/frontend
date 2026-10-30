import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AuthContextService } from "./auth-context.service";
import { sessionRevocationInterceptor } from "./session-revocation.interceptor";

describe("sessionRevocationInterceptor", () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let context: { revision: number; clear: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    context = { revision: 0, clear: vi.fn(() => context.revision++) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionRevocationInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthContextService, useValue: context },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    navigate = vi
      .spyOn(TestBed.inject(Router), "navigateByUrl")
      .mockResolvedValue(true);
  });
  afterEach(() => http.verify());
  for (const url of [
    "/api/user",
    "/api/personas",
    "/reauthenticate",
    "/logout",
  ])
    it("limpia contexto y vuelve al acceso ante 401: " + url, () => {
      client.post(url, {}).subscribe({ error: () => {} });
      http
        .expectOne(url)
        .flush(
          { code: "ACCESS_REVOKED" },
          { status: 401, statusText: "Unauthorized" },
        );
      expect(context.clear).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith(
        "/acceso?estado=sesion-finalizada",
        { replaceUrl: true },
      );
      http.expectNone(url);
    });
  for (const status of [403, 409, 422, 423, 429, 500])
    it("no cierra sesion ni reintenta por HTTP " + status, () => {
      client
        .post("/api/usuarios/25/habilitar", {})
        .subscribe({ error: () => {} });
      http
        .expectOne("/api/usuarios/25/habilitar")
        .flush({}, { status, statusText: "Rejected" });
      expect(context.clear).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      http.expectNone("/api/usuarios/25/habilitar");
    });
  for (const url of ["/login", "https://otro.example/api/user"])
    it("no atribuye al contexto propio un 401 de " + url, () => {
      client.post(url, {}).subscribe({ error: () => {} });
      http
        .expectOne(url)
        .flush({}, { status: 401, statusText: "Unauthorized" });
      expect(context.clear).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  it("una respuesta antigua no vuelve a cerrar un contexto renovado", () => {
    client.get("/api/user").subscribe({ error: () => {} });
    const request = http.expectOne("/api/user");
    context.revision++;
    request.flush({}, { status: 401, statusText: "Unauthorized" });
    expect(context.clear).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('sessionRevocationInterceptor con contexto real', () => {
  it('carga contexto sin dependencia circular y lo elimina ante revocacion', () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([sessionRevocationInterceptor])),
      provideHttpClientTesting(), provideRouter([]),
    ] });
    const context = TestBed.inject(AuthContextService);
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    context.refresh().subscribe();
    http.expectOne('/api/user').flush({ id: 1, name: 'Cuenta', permissions: ['usuarios.ver'] });
    expect(context.hasPermission('usuarios.ver')).toBe(true);
    TestBed.inject(HttpClient).get('/api/usuarios').subscribe({ error: () => {} });
    http.expectOne('/api/usuarios').flush({ code: 'ACCESS_REVOKED' }, { status: 401, statusText: 'Unauthorized' });
    expect(context.user()).toBeNull();
    expect(context.hasPermission('usuarios.ver')).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/acceso?estado=sesion-finalizada', { replaceUrl: true });
    http.verify();
  });
});
