import { signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AuthContextService } from "../../../../auth/auth-context.service";
import { UserSummary } from "../../../user.models";
import { UserAccessPanelComponent } from "./user-access-panel.component";

describe("UserAccessPanelComponent", () => {
  let fixture: ComponentFixture<UserAccessPanelComponent>;
  let component: UserAccessPanelComponent;
  let http: HttpTestingController;
  const permissions = signal<string[]>([]);
  let actorId: number;
  let context: {
    hasPermission: (p: string) => boolean;
    user: () => { id: number };
    clear: ReturnType<typeof vi.fn>;
  };
  const user: UserSummary = {
    id: 25,
    id_persona: "persona-25",
    name: "Persona de prueba",
    email: "p@example.test",
    created_at: "2026-10-29T12:00:00Z",
    person: null,
    access_status: "PENDIENTE",
  };
  beforeEach(async () => {
    permissions.set(["usuarios.habilitar", "usuarios.deshabilitar"]);
    actorId = 1;
    context = {
      hasPermission: (p) => permissions().includes(p),
      user: () => ({ id: actorId }),
      clear: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [UserAccessPanelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthContextService, useValue: context },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UserAccessPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("user", { ...user });
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function start(operation: "enable" | "disable" = "enable") {
    component.open(operation);
    component.reviewed.setValue(true);
    component.form.controls.password.setValue("ClaveAdministrativa");
    component.confirm();
    return http.expectOne("/reauthenticate");
  }
  it("muestra el estado recibido y exige revisar roles", () => {
    expect(fixture.nativeElement.textContent).toContain(
      "Pendiente de habilitación",
    );
    component.open("enable");
    component.form.controls.password.setValue("Clave");
    component.confirm();
    http.expectNone("/reauthenticate");
  });
  it("oculta acciones y bloquea invocacion directa sin permiso", () => {
    permissions.set([]);
    fixture.detectChanges();
    expect(component.canEnable()).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[data-testid="enable-user-access"]'),
    ).toBeNull();
    component.open("enable");
    expect(component.operation()).toBeNull();
    http.expectNone("/reauthenticate");
  });
  it("no habilita una cuenta sin Persona", () => {
    fixture.componentRef.setInput("user", { ...user, id_persona: null });
    fixture.detectChanges();
    expect(component.canEnable()).toBe(false);
  });
  it("no supone habilitado cuando falta el estado", () => {
    fixture.componentRef.setInput("user", {
      ...user,
      access_status: undefined,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Estado no informado");
    expect(component.canEnable()).toBe(false);
    expect(component.canDisable()).toBe(false);
  });
  it("espera reautenticacion y actualiza solo tras confirmacion", () => {
    const changed = vi.spyOn(component.changed, "emit");
    const req = start();
    expect(req.request.body).toEqual({ password: "ClaveAdministrativa" });
    expect(component.form.controls.password.value).toBe("");
    http.expectNone("/api/usuarios/25/habilitar");
    expect(changed).not.toHaveBeenCalled();
    req.flush(null);
    const mutation = http.expectOne("/api/usuarios/25/habilitar");
    expect(mutation.request.body).toEqual({ roles_revisados: true });
    expect(changed).not.toHaveBeenCalled();
    mutation.flush({
      id: 25,
      id_persona: "persona-25",
      access_status: "HABILITADO",
      access_version: 2,
    });
    expect(changed).toHaveBeenCalledOnce();
    expect(component.notice()).toContain("Cuenta habilitada");
    expect(component.processing()).toBe(false);
  });
  it("rechaza duplicados mientras reautentica y mientras cambia el estado", () => {
    const req = start();
    component.confirm();
    http.expectNone("/reauthenticate");
    req.flush(null);
    const mutation = http.expectOne("/api/usuarios/25/habilitar");
    component.confirm();
    http.expectNone("/api/usuarios/25/habilitar");
    component.cancel();
    expect(component.processing()).toBe(true);
    mutation.flush({
      id: 25,
      id_persona: "p",
      access_status: "HABILITADO",
      access_version: 2,
    });
  });
  it("cancela confirmacion sin peticiones ni credenciales retenidas", () => {
    component.open("enable");
    component.reviewed.setValue(true);
    component.form.controls.password.setValue("Privada");
    component.cancel();
    expect(component.operation()).toBeNull();
    expect(component.form.controls.password.value).toBe("");
    expect(component.reviewed.value).toBe(false);
  });
  it("no cambia acceso cuando falla la contrasena", () => {
    start().flush({}, { status: 422, statusText: "Unprocessable Entity" });
    http.expectNone("/api/usuarios/25/habilitar");
    expect(component.error()).toContain("contraseña");
    expect(component.form.controls.password.value).toBe("");
  });
  for (const [status, code, text] of [
    [409, "LAST_ENABLED_ADMIN", "otro administrador"],
    [403, "", "autorización"],
    [423, "", "caducó"],
    [429, "", "límite"],
    [422, "", "Persona activa"],
    [401, "ACCESS_REVOKED", "sesión finalizó"],
    [503, "", "Consulta de nuevo"],
  ] as const)
    it("presenta error " + status + " sin repetir la mutacion", () => {
      start().flush(null);
      http
        .expectOne("/api/usuarios/25/habilitar")
        .flush({ code }, { status, statusText: "Rejected" });
      expect(component.error()).toContain(text);
      expect(component.notice()).toBeNull();
      expect(component.processing()).toBe(false);
      expect(component.form.controls.password.value).toBe("");
      http.expectNone("/api/usuarios/25/habilitar");
    });
  it("deshabilita despues de reautenticar", () => {
    fixture.componentRef.setInput("user", {
      ...user,
      access_status: "HABILITADO",
    });
    fixture.detectChanges();
    start("disable").flush(null);
    http
      .expectOne("/api/usuarios/25/deshabilitar")
      .flush({
        id: 25,
        id_persona: "p",
        access_status: "DESHABILITADO",
        access_version: 2,
      });
    expect(component.notice()).toContain("revocadas");
  });
  it("descarta reautenticacion al cambiar de Persona", () => {
    const pending = start();
    fixture.componentRef.setInput("user", { ...user, id: 26 });
    fixture.detectChanges();
    expect(pending.cancelled).toBe(true);
    expect(component.processing()).toBe(false);
    http.expectNone("/api/usuarios/25/habilitar");
  });
  it("respeta el bloqueo de una operacion de roles", () => {
    fixture.componentRef.setInput("blocked", true);
    fixture.detectChanges();
    component.open("enable");
    expect(component.operation()).toBeNull();
  });
  it("exige nuevo login si se modifica el acceso propio", () => {
    actorId = 25;
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigateByUrl")
      .mockResolvedValue(true);
    start().flush(null);
    http
      .expectOne("/api/usuarios/25/habilitar")
      .flush({
        id: 25,
        id_persona: "p",
        access_status: "HABILITADO",
        access_version: 2,
      });
    expect(context.clear).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/acceso?estado=sesion-finalizada", {
      replaceUrl: true,
    });
  });
  it("destruir el formulario cancela reautenticacion sin enviar mutacion", () => {
    const req = start();
    fixture.destroy();
    expect(req.cancelled).toBe(true);
    http.expectNone("/api/usuarios/25/habilitar");
  });
});
