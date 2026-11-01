import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { UserRolePermissionsBrowserComponent } from "./user-role-permissions-browser.component";

describe("Usuarios, roles y permisos", () => {
  let component: UserRolePermissionsBrowserComponent;
  let http: HttpTestingController;

  const user = {
    id: 12,
    id_persona: "00000000-0000-0000-0000-000000000001",
    name: "Persona de prueba",
    email: "prueba@example.invalid",
    created_at: "2026-01-01",
    person: null,
    roles: [{ id: 3, code: "CONSULTA", name: "Consulta" }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRolePermissionsBrowserComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      UserRolePermissionsBrowserComponent
    );
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function load(): void {
    const req = http.expectOne(r =>
      r.url === "/api/usuarios" &&
      r.params.get("page") === "1"
    );
    expect(req.request.method).toBe("GET");
    req.flush({
      data: [user],
      meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
    });
  }

  it("consulta usuarios reales mediante endpoint autorizado", () => {
    load();
    expect(component.users()).toHaveLength(1);
    expect(component.personName(component.users()[0]))
      .toBe("Persona de prueba");
  });

  it("abre los roles del usuario y consulta sus permisos", () => {
    load();
    component.selectUser(component.users()[0]);
    component.selectRole(component.users()[0].roles![0]);

    const req = http.expectOne("/api/roles/3/permisos");
    expect(req.request.method).toBe("GET");
    req.flush({
      data: [{ id: 2, code: "usuarios.ver", effect: "ALLOW" }],
    });

    expect(component.rules()[0].code).toBe("usuarios.ver");
    expect(component.rules()[0].effect).toBe("ALLOW");
  });

  it("ignora una respuesta anterior cuando se cierra el rol", () => {
    load();
    component.selectUser(component.users()[0]);
    const role = component.users()[0].roles![0];
    component.selectRole(role);
    const req = http.expectOne("/api/roles/3/permisos");
    component.selectRole(role);

    req.flush({
      data: [{ id: 2, code: "usuarios.ver", effect: "ALLOW" }],
    });

    expect(component.selectedRoleId()).toBeNull();
    expect(component.rules()).toEqual([]);
  });

  it("muestra un error 403 sin habilitar modificaciones", () => {
    load();
    component.selectUser(component.users()[0]);
    component.selectRole(component.users()[0].roles![0]);

    http.expectOne("/api/roles/3/permisos").flush(
      { message: "Forbidden" },
      { status: 403, statusText: "Forbidden" }
    );

    expect(component.rulesError()).toContain("denegó");
  });
});
