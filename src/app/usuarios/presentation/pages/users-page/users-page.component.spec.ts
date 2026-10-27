import { HttpClient, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { UsersPageComponent } from "./users-page.component";

describe("UsersPageComponent", () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let component: UsersPageComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function expectPage(page: number) {
    return http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios" &&
        request.params.get("page") === String(page),
    );
  }

  function respond(
    page: number,
    lastPage: number,
    total: number,
  ): void {
    expectPage(page).flush({
      data: [
        {
          id: page,
          id_persona: null,
          name: `Usuario ${page}`,
          email: `usuario${page}@example.test`,
          created_at: "2026-10-26T12:00:00Z",
          person: null,
        },
      ],
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: 20,
        total,
      },
    });
  }

  it("consulta la primera pagina al iniciar", () => {
    fixture.detectChanges();

    expect(component.loading()).toBe(true);

    respond(1, 1, 1);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.users().length).toBe(1);
    expect(component.users()[0].name).toBe("Usuario 1");

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="user-row"]',
      ).length,
    ).toBe(1);
  });

  it("permite avanzar a otra pagina", () => {
    fixture.detectChanges();
    respond(1, 3, 45);
    fixture.detectChanges();

    const next: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="next-page"]',
      );

    next.click();

    expect(component.loading()).toBe(true);

    respond(2, 3, 45);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(component.users()[0].name).toBe("Usuario 2");
  });

  it("muestra errores de consulta", () => {
    fixture.detectChanges();

    expectPage(1).flush(
      { message: "Forbidden" },
      {
        status: 403,
        statusText: "Forbidden",
      },
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).not.toBeNull();

    const alert = fixture.nativeElement.querySelector(
      '[data-testid="users-error"]',
    );

    expect(alert).not.toBeNull();
  });

  it("permite reintentar despues de un error", () => {
    fixture.detectChanges();

    expectPage(1).flush(
      { message: "Error temporal" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    fixture.detectChanges();

    const retry: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="users-error"] button',
      );

    retry.click();

    respond(1, 1, 1);
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.users().length).toBe(1);
  });

  it("evita solicitudes simultaneas", () => {
    fixture.detectChanges();

    component.loadPage(1);
    component.loadPage(2);

    expect(http.match("/api/usuarios").length).toBe(0);

    respond(1, 2, 25);

    expect(component.loading()).toBe(false);
    expect(component.currentPage()).toBe(1);
  });

  it("rechaza paginas fuera de los limites", () => {
    fixture.detectChanges();
    respond(1, 2, 25);

    component.loadPage(0);
    component.loadPage(3);

    expect(http.match("/api/usuarios").length).toBe(0);
    expect(component.currentPage()).toBe(1);
  });
  it("consulta los roles del usuario seleccionado", () => {
    fixture.detectChanges();
    respond(1, 1, 1);
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="view-user-roles"]',
      );

    button.click();
    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(1);
    expect(component.rolesLoading()).toBe(true);

    const request = http.expectOne("/api/usuarios/1/roles");

    expect(request.request.method).toBe("GET");

    request.flush({
      data: [
        {
          id: 2,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.rolesLoading()).toBe(false);
    expect(component.selectedRoles().length).toBe(1);
    expect(
      fixture.nativeElement.textContent,
    ).toContain("Gestor de Personas");
  });

  it("permite cerrar el detalle de roles", () => {
    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles")
      .flush({ data: [] });

    fixture.detectChanges();

    const closeButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="close-user-roles"]',
      );

    closeButton.click();
    fixture.detectChanges();

    expect(component.selectedUser()).toBeNull();
    expect(component.selectedRoles()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector("app-user-roles"),
    ).toBeNull();
  });

  it("ignora respuestas atrasadas de otro usuario", () => {
    fixture.detectChanges();
    respond(1, 1, 1);

    const firstUser = component.users()[0];

    const secondUser = {
      ...firstUser,
      id: 2,
      name: "Segundo usuario",
      email: "segundo@example.test",
    };

    component.selectUser(firstUser);

    const firstRequest = http.expectOne(
      "/api/usuarios/1/roles",
    );

    component.selectUser(secondUser);

    const secondRequest = http.expectOne(
      "/api/usuarios/2/roles",
    );

    secondRequest.flush({
      data: [
        {
          id: 3,
          code: "ROL_CONSULTA_PERSONAS",
          name: "Consulta de Personas",
        },
      ],
    });

    firstRequest.flush({
      data: [
        {
          id: 2,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(2);
    expect(component.selectedRoles().length).toBe(1);
    expect(component.selectedRoles()[0].code)
      .toBe("ROL_CONSULTA_PERSONAS");

    expect(fixture.nativeElement.textContent)
      .toContain("Consulta de Personas");

    expect(fixture.nativeElement.textContent)
      .not.toContain("Gestor de Personas");
  });

  it("permite reintentar la consulta de roles", () => {
    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles").flush(
      { message: "Error temporal" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    fixture.detectChanges();

    expect(component.rolesError()).not.toBeNull();

    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="roles-error"] button',
      );

    retryButton.click();

    http.expectOne("/api/usuarios/1/roles")
      .flush({ data: [] });

    fixture.detectChanges();

    expect(component.rolesError()).toBeNull();
    expect(component.rolesLoading()).toBe(false);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="roles-empty"]',
      ),
    ).not.toBeNull();
  });

  function loadAuthenticatedUser(
    permissions: string[],
  ): void {
    const context = TestBed.inject(AuthContextService);

    context.refresh().subscribe();

    http.expectOne("/api/user").flush({
      id: 10,
      id_persona: null,
      name: "Administrador de prueba",
      email: "admin@example.test",
      email_verified_at: null,
      created_at: "2026-10-26T12:00:00Z",
      updated_at: "2026-10-26T12:00:00Z",
      person: null,
      permissions,
    });
  }

  it("oculta controles administrativos sin permiso", () => {
    loadAuthenticatedUser(["usuarios.ver"]);

    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.canManageRoles()).toBe(false);

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

    expect(fixture.nativeElement.textContent)
      .toContain("Gestor de Personas");
  });

  it("muestra controles para roles ordinarios con permiso", () => {
    loadAuthenticatedUser([
      "usuarios.ver",
      "usuarios.asignar_roles",
    ]);

    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.canManageRoles()).toBe(true);

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="remove-user-role"]',
      ),
    ).not.toBeNull();
  });

  it("protege el retiro del rol administrativo aun con permiso", () => {
    loadAuthenticatedUser([
      "usuarios.ver",
      "usuarios.asignar_roles",
    ]);

    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [
        {
          id: 1,
          code: "ROL_ADMIN_SISTEMA",
          name: "Administrador del Sistema",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.canManageRoles()).toBe(true);

    expect(fixture.nativeElement.textContent)
      .toContain("Rol administrativo protegido");

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="remove-user-role"]',
      ),
    ).toBeNull();
  });

  function prepareUserForCatalog(
    permissions: string[],
  ): void {
    loadAuthenticatedUser(permissions);

    fixture.detectChanges();
    respond(1, 1, 1);

    component.selectUser(component.users()[0]);

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [],
    });

    fixture.detectChanges();
  }

  it("consulta el catalogo con ambos permisos", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="assign-user-role"]',
      );

    expect(button).not.toBeNull();

    button.click();

    expect(component.roleSelectorOpen()).toBe(true);
    expect(component.roleCatalogLoading()).toBe(true);

    const request = http.expectOne("/api/roles");

    expect(request.request.method).toBe("GET");

    request.flush({
      data: [
        {
          id: 2,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.roleCatalogLoading()).toBe(false);
    expect(component.roleCatalog().length).toBe(1);

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="select-available-role"]',
      ),
    ).not.toBeNull();
  });

  it("no consulta el catalogo cuando falta roles.ver", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
    ]);

    component.openRoleSelector();

    expect(component.roleSelectorOpen()).toBe(false);
    expect(http.match("/api/roles").length).toBe(0);
  });

  it("no consulta el catalogo sin permiso para asignar roles", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "roles.ver",
    ]);

    component.openRoleSelector();

    expect(component.roleSelectorOpen()).toBe(false);
    expect(http.match("/api/roles").length).toBe(0);
  });

  it("permite reintentar la consulta del catalogo", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    component.openRoleSelector();

    http.expectOne("/api/roles").flush(
      { message: "Error temporal" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    fixture.detectChanges();

    expect(component.roleCatalogError()).not.toBeNull();

    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="retry-role-catalog"]',
      );

    retryButton.click();

    http.expectOne("/api/roles").flush({
      data: [],
    });

    fixture.detectChanges();

    expect(component.roleCatalogError()).toBeNull();
    expect(component.roleCatalogLoading()).toBe(false);
  });

  it("ignora el catalogo atrasado al cambiar de usuario", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    component.openRoleSelector();

    const oldRequest = http.expectOne("/api/roles");

    const secondUser = {
      ...component.users()[0],
      id: 2,
      name: "Segundo usuario",
      email: "segundo@example.test",
    };

    component.selectUser(secondUser);

    http.expectOne("/api/usuarios/2/roles").flush({
      data: [],
    });

    oldRequest.flush({
      data: [
        {
          id: 3,
          code: "ROL_CONSULTA_PERSONAS",
          name: "Consulta de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(2);
    expect(component.roleSelectorOpen()).toBe(false);
    expect(component.roleCatalog()).toEqual([]);
    expect(component.roleCatalogLoading()).toBe(false);

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-selector",
      ),
    ).toBeNull();
  });

  it("ignora el catalogo recibido despues de cerrar el selector", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    component.openRoleSelector();

    const pendingRequest = http.expectOne("/api/roles");

    component.closeRoleSelector();

    pendingRequest.flush({
      data: [
        {
          id: 2,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.roleSelectorOpen()).toBe(false);
    expect(component.roleCatalog()).toEqual([]);
    expect(component.roleCatalogError()).toBeNull();
    expect(component.roleCatalogLoading()).toBe(false);
  });

  function prepareRoleConfirmation(): void {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    component.openRoleSelector();

    http.expectOne("/api/roles").flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    const roleButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="select-available-role"]',
      );

    roleButton.click();
    fixture.detectChanges();
  }

  it("abre la confirmacion al seleccionar un rol disponible", () => {
    prepareRoleConfirmation();

    expect(component.roleSelectorOpen()).toBe(false);
    expect(component.selectedRoleForOperation()?.id).toBe(3);

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).not.toBeNull();

    expect(fixture.nativeElement.textContent)
      .toContain("Confirmar asignación");

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      ).disabled,
    ).toBe(true);
  });

  it("cancela la confirmacion y limpia la contrasena", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    fixture.detectChanges();

    const cancelButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="cancel-user-role-operation"]',
      );

    cancelButton.click();
    fixture.detectChanges();

    expect(component.selectedRoleForOperation()).toBeNull();

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).toBeNull();
  });

  it("descarta la confirmacion al cambiar de usuario", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    const secondUser = {
      ...component.users()[0],
      id: 2,
      name: "Segundo usuario",
      email: "segundo@example.test",
    };

    component.selectUser(secondUser);

    http.expectOne("/api/usuarios/2/roles").flush({
      data: [],
    });

    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(2);
    expect(component.selectedRoleForOperation()).toBeNull();

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).toBeNull();
  });

  it("descarta la confirmacion al cerrar el detalle", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.closeUserRoles();
    fixture.detectChanges();

    expect(component.selectedUser()).toBeNull();
    expect(component.selectedRoleForOperation()).toBeNull();

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).toBeNull();
  });

  it("no abre confirmacion para el rol administrador", () => {
    prepareUserForCatalog([
      "usuarios.ver",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    component.openRoleConfirmation({
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del Sistema",
    });

    fixture.detectChanges();

    expect(component.selectedRoleForOperation()).toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).toBeNull();
  });

  it("envia la contrasena solamente a reauthenticate", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    button.click();

    const request = http.expectOne("/reauthenticate");

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      password: "ClaveTemporalDePrueba",
    });

    expect(component.roleOperationProcessing()).toBe(true);

    request.flush(null);

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(component.roleOperationProcessing()).toBe(true);

    completeRoleAssignment();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.selectedRoles()[0].id).toBe(3);
  });

  it("asigna el rol solo despues de reautenticar", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    expect(http.match("/api/usuarios/1/roles").length).toBe(0);

    http.expectOne("/reauthenticate").flush(null);

    expect(component.roleOperationProcessing()).toBe(true);

    completeRoleAssignment();

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.selectedRoleForOperation()).toBeNull();
    expect(component.selectedRoles()[0].id).toBe(3);
    expect(component.roleOperationError()).toBeNull();
  });

  it("muestra error 422 y limpia la contrasena", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    http.expectOne("/reauthenticate").flush(
      { message: "Contraseña incorrecta" },
      {
        status: 422,
        statusText: "Unprocessable Content",
      },
    );

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.rolePasswordError()).not.toBeNull();

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(http.match("/api/usuarios/1/roles").length).toBe(0);
  });

  it("impide reautenticaciones simultaneas", () => {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    const pendingRequest = http.expectOne("/reauthenticate");

    component.confirmRoleAssignment();

    expect(component.roleOperationProcessing()).toBe(true);
    expect(http.match("/reauthenticate").length).toBe(0);

    pendingRequest.flush(null);
    completeRoleAssignment();

    expect(component.roleOperationProcessing()).toBe(false);
  });

  function completeRoleAssignment(): void {
    const assignment = http.expectOne("/api/usuarios/1/roles");

    expect(assignment.request.method).toBe("POST");
    expect(assignment.request.body).toEqual({ role_id: 3 });

    assignment.flush(
      {
        user_id: 1,
        role_id: 3,
        assigned: true,
      },
      {
        status: 201,
        statusText: "Created",
      },
    );

    const refresh = http.expectOne("/api/usuarios/1/roles");

    expect(refresh.request.method).toBe("GET");

    refresh.flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });
  }
  function startPendingRoleReauthentication() {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    const request = http.expectOne("/reauthenticate");

    expect(request.request.method).toBe("POST");
    expect(component.roleOperationProcessing()).toBe(true);

    return request;
  }

  it("bloquea el cambio de usuario durante reautenticacion", () => {
    const pending = startPendingRoleReauthentication();

    const originalUser = component.selectedUser();
    const originalRole = component.selectedRoleForOperation();

    const anotherUser = {
      ...component.users()[0],
      id: 25,
      name: "Otro usuario",
      email: "otro@example.test",
    };

    component.selectUser(anotherUser);

    expect(component.selectedUser()).toEqual(originalUser);
    expect(component.selectedRoleForOperation()).toEqual(originalRole);
    expect(component.roleOperationProcessing()).toBe(true);

    expect(http.match("/api/usuarios/25/roles").length).toBe(0);

    pending.flush(null);
    completeRoleAssignment();
  });

  it("bloquea el cierre del detalle durante reautenticacion", () => {
    const pending = startPendingRoleReauthentication();

    component.closeUserRoles();
    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(1);
    expect(component.selectedRoleForOperation()?.id).toBe(3);

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).not.toBeNull();

    expect(component.roleOperationProcessing()).toBe(true);

    pending.flush(null);
    completeRoleAssignment();
  });

  it("impide abrir otro selector o confirmacion pendiente", () => {
    const pending = startPendingRoleReauthentication();

    component.openRoleSelector();

    component.openRoleConfirmation({
      id: 4,
      code: "ROL_CONSULTA_PERSONAS",
      name: "Consulta de Personas",
    });

    expect(component.roleSelectorOpen()).toBe(false);
    expect(component.selectedRoleForOperation()?.id).toBe(3);
    expect(http.match("/api/roles").length).toBe(0);

    pending.flush(null);
    completeRoleAssignment();
  });

  it("recupera el funcionamiento al finalizar reautenticacion", () => {
    const pending = startPendingRoleReauthentication();

    pending.flush(null);
    completeRoleAssignment();

    expect(component.roleOperationProcessing()).toBe(false);

    component.closeRoleConfirmation();

    expect(component.selectedRoleForOperation()).toBeNull();

    const anotherUser = {
      ...component.users()[0],
      id: 25,
      name: "Otro usuario",
      email: "otro@example.test",
    };

    component.selectUser(anotherUser);

    http.expectOne("/api/usuarios/25/roles").flush({
      data: [],
    });

    fixture.detectChanges();

    expect(component.selectedUser()?.id).toBe(25);
    expect(component.roleOperationProcessing()).toBe(false);
    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");
  });

  function startPendingRoleAssignment() {
    prepareRoleConfirmation();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    http.expectOne("/reauthenticate").flush(null);

    const assignment = http.expectOne("/api/usuarios/1/roles");

    expect(assignment.request.method).toBe("POST");
    expect(assignment.request.body).toEqual({ role_id: 3 });
    expect(component.roleOperationProcessing()).toBe(true);

    return assignment;
  }

  it("muestra error 403 cuando Laravel rechaza la autorizacion", () => {
    const assignment = startPendingRoleAssignment();

    assignment.flush(
      { message: "Forbidden" },
      {
        status: 403,
        statusText: "Forbidden",
      },
    );

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "No tienes autorización",
    );
    expect(component.selectedRoles()).toEqual([]);
    expect(component.selectedRoleForOperation()?.id).toBe(3);
  });

  it("muestra error 422 cuando Laravel rechaza la asignacion", () => {
    const assignment = startPendingRoleAssignment();

    assignment.flush(
      { message: "Rol no asignable" },
      {
        status: 422,
        statusText: "Unprocessable Content",
      },
    );

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "rechazó la asignación",
    );
    expect(component.selectedRoles()).toEqual([]);
  });

  it("muestra error 423 cuando caduca la reautenticacion", () => {
    const assignment = startPendingRoleAssignment();

    assignment.flush(
      { message: "Reauthentication required" },
      {
        status: 423,
        statusText: "Locked",
      },
    );

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "ha caducado",
    );

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(component.selectedRoles()).toEqual([]);
  });

  it("muestra error cuando falla temporalmente Laravel", () => {
    const assignment = startPendingRoleAssignment();

    assignment.flush(
      { message: "Service unavailable" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "No fue posible completar",
    );
    expect(component.selectedRoles()).toEqual([]);
  });

  it("bloquea cambiar de usuario durante la asignacion HTTP", () => {
    const assignment = startPendingRoleAssignment();

    const originalUser = component.selectedUser();

    component.selectUser({
      ...component.users()[0],
      id: 25,
      name: "Otro usuario",
      email: "otro@example.test",
    });

    component.closeUserRoles();

    expect(component.selectedUser()).toEqual(originalUser);
    expect(component.selectedRoleForOperation()?.id).toBe(3);
    expect(component.roleOperationProcessing()).toBe(true);

    expect(http.match("/api/usuarios/25/roles").length).toBe(0);

    assignment.flush(
      {
        user_id: 1,
        role_id: 3,
        assigned: true,
      },
      {
        status: 201,
        statusText: "Created",
      },
    );

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.selectedRoles()[0].id).toBe(3);
  });

  it("impide confirmaciones duplicadas durante la asignacion", () => {
    const assignment = startPendingRoleAssignment();

    component.confirmRoleAssignment();
    component.openRoleSelector();

    expect(component.roleOperationProcessing()).toBe(true);
    expect(component.roleSelectorOpen()).toBe(false);

    expect(http.match("/reauthenticate").length).toBe(0);

    assignment.flush(
      {
        user_id: 1,
        role_id: 3,
        assigned: true,
      },
      {
        status: 201,
        statusText: "Created",
      },
    );

    http.expectOne("/api/usuarios/1/roles").flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    expect(component.roleOperationProcessing()).toBe(false);
  });

  function confirmAssignmentAndGetRefresh() {
    const assignment = startPendingRoleAssignment();

    assignment.flush(
      {
        user_id: 1,
        role_id: 3,
        assigned: true,
      },
      {
        status: 201,
        statusText: "Created",
      },
    );

    return http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    );
  }

  it("muestra el resultado cuando Laravel confirma la asignacion", () => {
    const refresh = confirmAssignmentAndGetRefresh();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.selectedRoleForOperation()).toBeNull();

    expect(component.roleOperationNotice()).toContain(
      "Laravel confirmó la asignación",
    );

    fixture.detectChanges();

    const notice: HTMLElement =
      fixture.nativeElement.querySelector(
        '[data-testid="role-operation-notice"]',
      );

    expect(notice).not.toBeNull();
    expect(notice.getAttribute("role")).toBe("status");

    refresh.flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });
  });

  it("conserva la confirmacion cuando falla la actualizacion", () => {
    const refresh = confirmAssignmentAndGetRefresh();

    refresh.flush(
      { message: "Error temporal" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    fixture.detectChanges();

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.rolesError()).not.toBeNull();

    expect(component.roleOperationNotice()).toContain(
      "Laravel confirmó la asignación",
    );

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="role-operation-notice"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="roles-error"]',
      ),
    ).not.toBeNull();
  });

  it("reintenta la consulta sin repetir el POST de asignacion", () => {
    const refresh = confirmAssignmentAndGetRefresh();

    refresh.flush(
      { message: "Error temporal" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    fixture.detectChanges();

    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="roles-error"] button',
      );

    retryButton.click();

    const retry = http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    );

    retry.flush({
      data: [
        {
          id: 3,
          code: "ROL_GESTOR_PERSONAS",
          name: "Gestor de Personas",
        },
      ],
    });

    fixture.detectChanges();

    expect(component.rolesError()).toBeNull();
    expect(component.selectedRoles()[0].id).toBe(3);

    expect(http.match(
      (request) =>
        request.method === "POST" &&
        request.url === "/api/usuarios/1/roles",
    ).length).toBe(0);

    expect(component.roleOperationNotice()).toContain(
      "Laravel confirmó la asignación",
    );
  });

  it("limpia el aviso al cambiar de usuario o cerrar detalle", () => {
    const refresh = confirmAssignmentAndGetRefresh();

    refresh.flush({ data: [] });

    expect(component.roleOperationNotice()).not.toBeNull();

    const secondUser = {
      ...component.users()[0],
      id: 25,
      name: "Otro usuario",
      email: "otro@example.test",
    };

    component.selectUser(secondUser);

    http.expectOne("/api/usuarios/25/roles").flush({
      data: [],
    });

    expect(component.roleOperationNotice()).toBeNull();

    component.roleOperationNotice.set(
      "Mensaje temporal de confirmación.",
    );

    component.closeUserRoles();

    fixture.detectChanges();

    expect(component.roleOperationNotice()).toBeNull();
    expect(component.selectedUser()).toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="role-operation-notice"]',
      ),
    ).toBeNull();
  });

  it("abre confirmacion de retiro para un rol asignado", () => {
    prepareRoleConfirmation();

    component.closeRoleConfirmation();

    const role = {
      id: 3,
      code: "ROL_GESTOR_PERSONAS",
      name: "Gestor de Personas",
    };

    component.selectedRoles.set([role]);

    component.openRoleRemoval(role);

    fixture.detectChanges();

    expect(component.selectedRoleOperation()).toBe("remove");
    expect(component.selectedRoleForOperation()).toEqual(role);

    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-confirmation",
      ),
    ).not.toBeNull();

    expect(http.match("/reauthenticate").length).toBe(0);
    expect(http.match("/api/usuarios/1/roles").length).toBe(0);
  });

  it("cancela retiro sin modificar roles", () => {
    prepareRoleConfirmation();

    component.closeRoleConfirmation();

    const role = {
      id: 3,
      code: "ROL_GESTOR_PERSONAS",
      name: "Gestor de Personas",
    };

    component.selectedRoles.set([role]);
    component.openRoleRemoval(role);

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.closeRoleConfirmation();

    expect(component.selectedRoleOperation()).toBe("assign");
    expect(component.selectedRoleForOperation()).toBeNull();
    expect(component.selectedRoles()).toEqual([role]);

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(http.match("/reauthenticate").length).toBe(0);
    expect(http.match("/api/usuarios/1/roles").length).toBe(0);
  });

  it("rechaza retirar el rol administrador protegido", () => {
    prepareRoleConfirmation();

    component.closeRoleConfirmation();

    const adminRole = {
      id: 99,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del Sistema",
    };

    component.selectedRoles.set([adminRole]);

    component.openRoleRemoval(adminRole);

    expect(component.selectedRoleForOperation()).toBeNull();
    expect(component.selectedRoleOperation()).toBe("assign");

    expect(http.match("/reauthenticate").length).toBe(0);
  });

  it("rechaza retirar roles no asignados al usuario", () => {
    prepareRoleConfirmation();

    component.closeRoleConfirmation();
    component.selectedRoles.set([]);

    component.openRoleRemoval({
      id: 45,
      code: "ROL_INEXISTENTE_EN_USUARIO",
      name: "Rol no asignado",
    });

    expect(component.selectedRoleForOperation()).toBeNull();
    expect(component.selectedRoleOperation()).toBe("assign");

    expect(http.match("/reauthenticate").length).toBe(0);
  });

  function prepareRoleRemoval() {
    prepareRoleConfirmation();

    component.closeRoleConfirmation();

    const role = {
      id: 3,
      code: "ROL_GESTOR_PERSONAS",
      name: "Gestor de Personas",
    };

    component.selectedRoles.set([role]);
    component.openRoleRemoval(role);

    expect(component.selectedRoleOperation()).toBe("remove");
    expect(component.selectedRoleForOperation()).toEqual(role);

    return role;
  }

  function startPendingRoleRemoval() {
    prepareRoleRemoval();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    const reauthentication = http.expectOne("/reauthenticate");

    expect(reauthentication.request.method).toBe("POST");
    expect(reauthentication.request.body).toEqual({
      password: "ClaveTemporalDePrueba",
    });

    reauthentication.flush(null);

    const removal = http.expectOne(
      "/api/usuarios/1/roles/3",
    );

    expect(removal.request.method).toBe("DELETE");
    expect(removal.request.body).toBeNull();

    return removal;
  }

  it("retira un rol solo despues de reautenticar", () => {
    prepareRoleRemoval();

    component.roleReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    component.confirmRoleAssignment();

    expect(
      http.match("/api/usuarios/1/roles/3").length,
    ).toBe(0);

    http.expectOne("/reauthenticate").flush(null);

    const removal = http.expectOne(
      "/api/usuarios/1/roles/3",
    );

    expect(removal.request.method).toBe("DELETE");
    expect(removal.request.body).toBeNull();
    expect(component.roleOperationProcessing()).toBe(true);

    removal.flush(null);

    const refresh = http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    );

    refresh.flush({ data: [] });

    fixture.detectChanges();

    expect(component.selectedRoles()).toEqual([]);
    expect(component.selectedRoleForOperation()).toBeNull();
    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationNotice()).toContain(
      "Laravel confirmó el retiro",
    );
  });

  it("no repite el retiro mientras existe un DELETE pendiente", () => {
    const removal = startPendingRoleRemoval();

    component.confirmRoleAssignment();
    component.closeUserRoles();

    expect(component.selectedUser()?.id).toBe(1);
    expect(component.roleOperationProcessing()).toBe(true);

    expect(
      http.match("/api/usuarios/1/roles/3").length,
    ).toBe(0);

    expect(
      http.match("/reauthenticate").length,
    ).toBe(0);

    removal.flush(null);

    http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    ).flush({ data: [] });

    expect(component.roleOperationProcessing()).toBe(false);
  });

  it("muestra error 403 si Laravel rechaza el retiro", () => {
    const removal = startPendingRoleRemoval();

    removal.flush(
      { message: "Forbidden" },
      {
        status: 403,
        statusText: "Forbidden",
      },
    );

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "No tienes autorización para retirar",
    );
    expect(component.selectedRoles()[0].id).toBe(3);
  });

  it("muestra error 422 si Laravel rechaza el rol retirado", () => {
    const removal = startPendingRoleRemoval();

    removal.flush(
      { message: "Rol protegido" },
      {
        status: 422,
        statusText: "Unprocessable Content",
      },
    );

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "rechazó el retiro",
    );
    expect(component.selectedRoles()[0].id).toBe(3);
  });

  it("muestra error 423 cuando caduca la reautenticacion del retiro", () => {
    const removal = startPendingRoleRemoval();

    removal.flush(
      { message: "Reauthentication required" },
      {
        status: 423,
        statusText: "Locked",
      },
    );

    expect(component.roleOperationProcessing()).toBe(false);
    expect(component.roleOperationError()).toContain(
      "ha caducado",
    );

    expect(
      component.roleReauthenticationForm.controls.password.value,
    ).toBe("");

    expect(component.selectedRoles()[0].id).toBe(3);
  });

  it("no repite DELETE si falla la consulta posterior al retiro", () => {
    const removal = startPendingRoleRemoval();

    removal.flush(null);

    const refresh = http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    );

    refresh.flush(
      { message: "Servicio no disponible" },
      {
        status: 503,
        statusText: "Service Unavailable",
      },
    );

    expect(component.roleOperationNotice()).toContain(
      "Laravel confirmó el retiro",
    );
    expect(component.rolesError()).not.toBeNull();

    component.retryUserRoles();

    http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/usuarios/1/roles",
    ).flush({ data: [] });

    expect(
      http.match(
        (request) =>
          request.method === "DELETE" &&
          request.url === "/api/usuarios/1/roles/3",
      ).length,
    ).toBe(0);

    expect(component.rolesError()).toBeNull();
    expect(component.selectedRoles()).toEqual([]);
  });
});