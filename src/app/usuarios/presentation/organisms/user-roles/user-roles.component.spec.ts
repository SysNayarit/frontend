import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSummary } from "../../../user.models";
import { UserRolesComponent } from "./user-roles.component";

describe("UserRolesComponent", () => {
  let fixture: ComponentFixture<UserRolesComponent>;
  let component: UserRolesComponent;

  const user: UserSummary = {
    id: 15,
    id_persona: null,
    name: "Usuario de prueba",
    email: "usuario@example.test",
    created_at: "2026-10-26T12:00:00Z",
    person: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserRolesComponent);
    component = fixture.componentInstance;
  });

  it("solicita seleccionar un usuario cuando no hay seleccion", () => {
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector(
      '[data-testid="no-selected-user"]',
    );

    expect(message).not.toBeNull();
    expect(message.textContent).toContain("Selecciona un usuario");
  });

  it("muestra el usuario seleccionado y sus roles", () => {
    component.user = user;
    component.roles = [
      {
        id: 2,
        code: "ROL_GESTOR_PERSONAS",
        name: "Gestor de Personas",
      },
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Usuario de prueba");
    expect(text).toContain("usuario@example.test");
    expect(text).toContain("Gestor de Personas");
    expect(text).toContain("ROL_GESTOR_PERSONAS");
  });

  it("identifica el rol administrador como protegido", () => {
    component.user = user;
    component.roles = [
      {
        id: 1,
        code: "ROL_ADMIN_SISTEMA",
        name: "Administrador del Sistema",
      },
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Rol administrativo protegido");
  });

  it("muestra estado de carga sin mostrar roles anteriores", () => {
    component.user = user;
    component.loading = true;
    component.roles = [
      {
        id: 2,
        code: "ROL_GESTOR_PERSONAS",
        name: "Gestor de Personas",
      },
    ];

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="roles-loading"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="assigned-roles"]',
      ),
    ).toBeNull();
  });

  it("muestra error y emite reintento", () => {
    component.user = user;
    component.error = "No fue posible consultar los roles.";

    let retries = 0;
    component.retry.subscribe(() => {
      retries++;
    });

    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector(
      '[data-testid="roles-error"]',
    );

    expect(alert).not.toBeNull();

    const button: HTMLButtonElement = alert.querySelector("button");
    button.click();

    expect(retries).toBe(1);
  });

  it("muestra lista vacia y permite cerrar el detalle", () => {
    component.user = user;
    component.roles = [];

    let closes = 0;
    component.close.subscribe(() => {
      closes++;
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="roles-empty"]',
      ),
    ).not.toBeNull();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="close-user-roles"]',
      );

    button.click();

    expect(closes).toBe(1);
  });

  it("oculta los controles de administracion sin permiso", () => {
    component.user = {
      id: 15,
      id_persona: null,
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    };

    component.roles = [{
      id: 3,
      code: "ROL_GESTOR_PERSONAS",
      name: "Gestor de Personas",
    }];

    component.canManageRoles = false;

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      ),
    ).toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="remove-user-role"]',
      ),
    ).toBeNull();
  });

  it("emite la solicitud para asignar un rol", () => {
    component.user = {
      id: 15,
      id_persona: null,
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    };

    component.canManageRoles = true;

    let requests = 0;

    component.assignRequested.subscribe(() => {
      requests++;
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      );

    expect(button).not.toBeNull();

    button.click();

    expect(requests).toBe(1);
  });

  it("emite el rol ordinario seleccionado para retiro", () => {
    component.user = {
      id: 15,
      id_persona: null,
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    };

    const role = {
      id: 3,
      code: "ROL_GESTOR_PERSONAS",
      name: "Gestor de Personas",
    };

    component.roles = [role];
    component.canManageRoles = true;

    const requestedRoles: number[] = [];

    component.removeRequested.subscribe((selectedRole) => {
      requestedRoles.push(selectedRole.id);
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="remove-user-role"]',
      );

    expect(button).not.toBeNull();

    button.click();

    expect(requestedRoles).toEqual([3]);
  });

  it("impide retirar el rol administrativo protegido", () => {
    component.user = {
      id: 15,
      id_persona: null,
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    };

    component.roles = [{
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del Sistema",
    }];

    component.canManageRoles = true;

    let requests = 0;

    component.removeRequested.subscribe(() => {
      requests++;
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="protected-admin-role"]',
      ),
    ).toBeNull();

    expect(
      fixture.nativeElement.textContent,
    ).toContain("Rol administrativo protegido");

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="remove-user-role"]',
      ),
    ).toBeNull();

    expect(requests).toBe(0);
  });

  it("oculta la asignacion mientras carga o existe error", () => {
    component.user = {
      id: 15,
      id_persona: null,
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    };

    component.canManageRoles = true;
    component.loading = true;

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      ),
    ).toBeNull();

    component.loading = false;
    component.error = "No fue posible consultar los roles.";

    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      ),
    ).toBeNull();
  });
});