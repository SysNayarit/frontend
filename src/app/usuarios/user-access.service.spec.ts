import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { UserAccessService } from "./user-access.service";

describe("UserAccessService", () => {
  let http: HttpTestingController;
  let service: UserAccessService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UserAccessService);
  });
  afterEach(() => http.verify());
  it("habilita con revision expresa y sin transmitir contrasena", () => {
    let status = "";
    service.change(25, "enable").subscribe((r) => (status = r.access_status));
    const req = http.expectOne("/api/usuarios/25/habilitar");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ roles_revisados: true });
    req.flush({
      id: 25,
      id_persona: "p",
      access_status: "HABILITADO",
      access_version: 2,
    });
    expect(status).toBe("HABILITADO");
  });
  it("deshabilita por el endpoint propio", () => {
    service.change(25, "disable").subscribe();
    const req = http.expectOne("/api/usuarios/25/deshabilitar");
    expect(req.request.body).toEqual({});
    req.flush({
      id: 25,
      id_persona: "p",
      access_status: "DESHABILITADO",
      access_version: 3,
    });
  });
  for (const value of [
    { id: 99, access_status: "HABILITADO", access_version: 2 },
    { id: 25, access_status: "PENDIENTE", access_version: 2 },
    { id: 25, access_status: "HABILITADO", access_version: 0 },
  ])
    it(
      "rechaza una confirmacion inconsistente: " + JSON.stringify(value),
      () => {
        let failed = false;
        service
          .change(25, "enable")
          .subscribe({ error: () => (failed = true) });
        http.expectOne("/api/usuarios/25/habilitar").flush(value);
        expect(failed).toBe(true);
      },
    );
});
