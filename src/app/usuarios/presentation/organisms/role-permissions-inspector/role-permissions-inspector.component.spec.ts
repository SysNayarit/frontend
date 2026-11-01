import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { RolePermissionsInspectorComponent } from "./role-permissions-inspector.component";

describe("Consulta de autorizaciones por rol", () => {
  let component: RolePermissionsInspectorComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePermissionsInspectorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      RolePermissionsInspectorComponent
    );
    fixture.componentRef.setInput("roles", [
      { id: 1, code: "ADMIN", name: "Administración" },
      { id: 2, code: "CONSULTA", name: "Consulta" },
    ]);
    fixture.detectChanges();

    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("consulta las reglas ALLOW y DENY del rol", () => {
    component.selectRole("1");

    const request = http.expectOne("/api/roles/1/permisos");
    expect(request.request.method).toBe("GET");

    request.flush({
      data: [
        { id: 10, code: "usuarios.ver", effect: "ALLOW" },
        { id: 11, code: "usuarios.crear", effect: "DENY" },
      ],
    });

    expect(component.permissions()).toHaveLength(2);
    expect(component.permissions()[1].effect).toBe("DENY");
    expect(component.loading()).toBe(false);
  });

  it("rechaza roles ajenos al catálogo", () => {
    component.selectRole("999");
    expect(component.error()).toContain("válido");
    http.expectNone("/api/roles/999/permisos");
  });

  it("muestra la denegación 403 de Laravel", () => {
    component.selectRole("2");
    http.expectOne("/api/roles/2/permisos").flush(
      { message: "Forbidden" },
      { status: 403, statusText: "Forbidden" }
    );

    expect(component.error()).toContain("autorización");
    expect(component.loading()).toBe(false);
  });

  it("ignora respuestas atrasadas al cambiar de rol", () => {
    component.selectRole("1");
    const first = http.expectOne("/api/roles/1/permisos");

    component.selectRole("2");
    const second = http.expectOne("/api/roles/2/permisos");

    second.flush({
      data: [{ id: 22, code: "personas.ver", effect: "ALLOW" }],
    });
    first.flush({
      data: [{ id: 11, code: "usuarios.ver", effect: "DENY" }],
    });

    expect(component.selectedRole()).toBe(2);
    expect(component.permissions()[0].code).toBe("personas.ver");
  });

  it("limpia resultados al deseleccionar", () => {
    component.selectRole("1");
    http.expectOne("/api/roles/1/permisos").flush({
      data: [{ id: 10, code: "usuarios.ver", effect: "ALLOW" }],
    });

    component.selectRole("");

    expect(component.selectedRole()).toBeNull();
    expect(component.permissions()).toEqual([]);
  });
});
