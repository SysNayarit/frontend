import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { UserProfileAdministrationComponent } from "./user-profile-administration.component";

describe("Administración institucional de perfiles", () => {
  let component: UserProfileAdministrationComponent;   let fixture: ComponentFixture<UserProfileAdministrationComponent>;
  let http: HttpTestingController;
  let permissions: Set<string>;
  let reauthenticate: ReturnType<typeof vi.fn>;
  let notifyOtherTabs: ReturnType<typeof vi.fn>;

  const assigned = [
    {
      id: 1,
      name: "Administrativo",
      code: "ADMIN",
      is_default: true,
      group: { id: 1, code: "GENERAL", name: "General" },
    },
    {
      id: 2,
      name: "Consulta",
      code: "CONSULTA",
      is_default: false,
      group: { id: 1, code: "GENERAL", name: "General" },
    },
  ];

  beforeEach(async () => {
    permissions = new Set([
      "usuarios.ver",
      "perfiles.ver",
      "usuarios.asignar_perfiles",
    ]);

    reauthenticate = vi.fn().mockReturnValue(of(undefined));
    notifyOtherTabs = vi.fn();

    await TestBed.configureTestingModule({
      imports: [UserProfileAdministrationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthContextService,
          useValue: {
            hasPermission: (code: string) => permissions.has(code),
            notifyOtherTabs,
          },
        },
        {
          provide: AuthService,
          useValue: { reauthenticate },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      UserProfileAdministrationComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function consult(): void {
    component.userInput.set("12");
    component.findUser(new Event("submit"));

    http.expectOne("/api/usuarios/12/perfiles").flush({
      user_id: 12,
      data: assigned,
    });

    if (permissions.has("usuarios.asignar_perfiles")) {
      http.expectOne("/api/perfiles").flush({
        data: [
          { id: 1, name: "Administrativo" },
          { id: 2, name: "Consulta" },
          { id: 3, name: "Operativo" },
        ],
      });
    } else {
      http.expectNone("/api/perfiles");
    }
  }

  it("consulta perfiles asignados y conserva el predeterminado", () => {
    consult();

    expect(component.selectedUserId()).toBe(12);
    expect(component.assigned()).toHaveLength(2);
    expect(component.assigned()[0].is_default).toBe(true);
    expect(component.availableProfiles().map(p => p.id)).toEqual([3]);
  });

  it("rechaza identificadores de usuario inválidos", () => {
    component.userInput.set("-1");
    component.findUser(new Event("submit"));

    expect(component.error()).toContain("válido");
    http.expectNone("/api/usuarios/-1/perfiles");
  });

  it("no prepara retiro del perfil predeterminado", () => {
    consult();
    component.prepare("remove", 1);

    expect(component.pending()).toBeNull();
  });

  it("permite retirar el unico perfil predeterminado tras reautenticar", () => {
    component.userInput.set("12");
    component.findUser(new Event("submit"));

    http.expectOne("/api/usuarios/12/perfiles").flush({
      user_id: 12,
      data: [assigned[0]],
    });

    http.expectOne("/api/perfiles").flush({
      data: [
        { id: 1, name: "Administrativo" },
        { id: 2, name: "Consulta" },
        { id: 3, name: "Operativo" },
      ],
    });

    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll("button")
    ) as HTMLButtonElement[];

    expect(
      buttons.some(button => button.textContent?.trim() === "Retirar")
    ).toBe(true);

    component.prepare("remove", 1);

    expect(component.pending()?.profileId).toBe(1);
    http.expectNone("/api/usuarios/12/perfiles/1");

    component.password.set("contrasena-local-de-prueba");
    component.confirm(new Event("submit"));

    expect(reauthenticate).toHaveBeenCalledOnce();

    const request = http.expectOne(
      "/api/usuarios/12/perfiles/1"
    );

    expect(request.request.method).toBe("DELETE");

    request.flush({
      user_id: 12,
      profile_id: 1,
      removed: true,
    });

    http.expectOne("/api/usuarios/12/perfiles").flush({
      user_id: 12,
      data: [],
    });

    http.expectOne("/api/perfiles").flush({
      data: [
        { id: 1, name: "Administrativo" },
        { id: 2, name: "Consulta" },
        { id: 3, name: "Operativo" },
      ],
    });

    expect(component.assigned()).toHaveLength(0);
    expect(component.pending()).toBeNull();
    expect(notifyOtherTabs).toHaveBeenCalledWith("permissions");
  });

  it("asigna un perfil únicamente después de reautenticar", () => {
    consult();
    component.prepare("assign", 3);

    expect(component.pending()?.profileId).toBe(3);
    http.expectNone("/api/usuarios/12/perfiles", "POST");

    component.password.set("contrasena-local-de-prueba");
    component.confirm(new Event("submit"));

    expect(reauthenticate).toHaveBeenCalledOnce();

    const request = http.expectOne(
      "/api/usuarios/12/perfiles",
    );
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({ profile_id: 3 });

    request.flush({
      user_id: 12,
      profile_id: 3,
      assigned: true,
    });

    http.expectOne("/api/usuarios/12/perfiles").flush({
      user_id: 12,
      data: [
        ...assigned,
        {
          id: 3,
          name: "Operativo",
          code: "OPERATIVO",
          is_default: false,
          group: { id: 1, code: "GENERAL", name: "General" },
        },
      ],
    });

    if (permissions.has("usuarios.asignar_perfiles")) {
      http.expectOne("/api/perfiles").flush({
        data: [
          { id: 1, name: "Administrativo" },
          { id: 2, name: "Consulta" },
          { id: 3, name: "Operativo" },
        ],
      });
    } else {
      http.expectNone("/api/perfiles");
    }

    expect(component.assigned()).toHaveLength(3);
    expect(component.pending()).toBeNull();
    expect(notifyOtherTabs).toHaveBeenCalledWith("permissions");
  });

  it("retira un perfil secundario tras reautenticación", () => {
    consult();
    component.prepare("remove", 2);
    component.password.set("contrasena-local-de-prueba");
    component.confirm(new Event("submit"));

    const request = http.expectOne(
      "/api/usuarios/12/perfiles/2",
    );
    expect(request.request.method).toBe("DELETE");
    request.flush({
      user_id: 12,
      profile_id: 2,
      removed: true,
    });

    http.expectOne("/api/usuarios/12/perfiles").flush({
      user_id: 12,
      data: [assigned[0]],
    });

    http.expectOne("/api/perfiles").flush({
      data: [
        { id: 1, name: "Administrativo" },
        { id: 2, name: "Consulta" },
      ],
    });

    expect(component.assigned()).toHaveLength(1);
    expect(component.assigned()[0].is_default).toBe(true);
  });

  it("impide operaciones cuando falta el permiso administrativo", () => {
    permissions.delete("usuarios.asignar_perfiles");
    consult();

    expect(component.canManage()).toBe(false);
    component.prepare("remove", 2);
    expect(component.pending()).toBeNull();
  });

  it("muestra errores 403 sin modificar perfiles", () => {
    consult();
    component.prepare("remove", 2);
    component.password.set("contrasena-local-de-prueba");
    component.confirm(new Event("submit"));

    http.expectOne("/api/usuarios/12/perfiles/2").flush(
      { message: "Prohibido" },
      { status: 403, statusText: "Forbidden" },
    );

    expect(component.error()).toContain("denegó");
    expect(component.assigned()).toHaveLength(2);
    expect(component.busy()).toBe(false);
  });

  it("no envía una mutación cuando falla la reautenticación", () => {
    consult();

    reauthenticate.mockReturnValue(
      throwError(() => new Error("Reautenticación rechazada")),
    );

    component.prepare("assign", 3);
    component.password.set("incorrecta");
    component.confirm(new Event("submit"));

    http.expectNone("/api/usuarios/12/perfiles", "POST");
    expect(component.pending()).toBeNull();
    expect(component.busy()).toBe(false);
  });
});
