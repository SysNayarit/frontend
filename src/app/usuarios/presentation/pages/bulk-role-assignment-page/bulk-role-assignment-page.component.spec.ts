import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { of, Subject } from "rxjs";
import { UserRoleService } from "../../../user-role.service";
import { UserService } from "../../../user.service";
import { UserListResponse, UserSummary } from "../../../user.models";
import { BulkRoleAssignmentPageComponent } from "./bulk-role-assignment-page.component";

describe("BulkRoleAssignmentPageComponent", () => {
  let page: BulkRoleAssignmentPageComponent;
  let fixture: ComponentFixture<BulkRoleAssignmentPageComponent>;

  function user(id: number, linked = true): UserSummary {
    return {
      id,
      name: `USUARIO ${id}`,
      email: `usuario${id}@institucional.com`,
      person: linked
        ? {
            id_persona: `persona-${id}`,
            num_expediente: `${id}`,
            nombres: "PERSONA",
            apellido_paterno: `${id}`,
            apellido_materno: null,
          }
        : null,
    } as unknown as UserSummary;
  }
  async function render(permissions: readonly string[]) {
    await TestBed.configureTestingModule({
      imports: [BulkRoleAssignmentPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: {
            list: () =>
              of({
                data: [],
                meta: {
                  current_page: 1,
                  last_page: 1,
                  total: 0,
                },
              }),
          },
        },
        {
          provide: UserRoleService,
          useValue: {
            assignRolesBulk: vi.fn(),
            removeRolesBulk: vi.fn(),
            listRoles: () =>
              of({
                data: [
                  {
                    id: 1,
                    code: "ROL_ADMIN_SISTEMA",
                    name: "Administrador del Sistema",
                  },
                  {
                    id: 3,
                    code: "ROL_CONSULTA_PERSONAS",
                    name: "Consulta de Personas",
                  },
                ],
              }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            reauthenticate: () => {
              throw new Error("Reautenticacion no configurada en esta prueba");
            },
          },
        },
        {
          provide: AuthContextService,
          useValue: {
            hasPermission: (permission: string) =>
              permissions.includes(permission),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkRoleAssignmentPageComponent);

    page = fixture.componentInstance;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("muestra la estructura de la pagina con ambos permisos", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
    ]);

    expect(root.textContent).toContain("Asignación masiva de roles");

    expect(
      root.querySelector('[data-testid="bulk-page-role-catalog"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-no-permission"]'),
    ).toBeNull();
  });

  it("selecciona un rol desde el componente reutilizable", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
    ]);

    const catalog = root.querySelector(
      '[data-testid="bulk-page-role-catalog"]',
    );

    expect(catalog).not.toBeNull();

    const buttons = catalog!.querySelectorAll<HTMLButtonElement>(
      '[data-testid="select-available-role"]',
    );

    // El administrador protegido no debe mostrarse como seleccionable.
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain("Consulta de Personas");

    expect(page.selectedRole()).toBeNull();

    buttons[0].click();
    fixture.detectChanges();

    expect(page.selectedRole()?.code).toBe("ROL_CONSULTA_PERSONAS");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0].textContent).toContain("Seleccionado");

    // La validacion de la pagina sigue rechazando el rol protegido.
    const protectedRole = {
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del Sistema",
    };

    page.selectRole(protectedRole);

    expect(page.selectedRole()?.code).toBe("ROL_CONSULTA_PERSONAS");
  });
  it("no habilita la operacion si falta asignar roles", async () => {
    const root = await render(["roles.ver"]);

    expect(
      root.querySelector('[data-testid="bulk-page-no-permission"]'),
    ).not.toBeNull();
  });

  it("no habilita la operacion si falta consultar roles", async () => {
    const root = await render(["usuarios.asignar_roles"]);

    expect(
      root.querySelector('[data-testid="bulk-page-no-permission"]'),
    ).not.toBeNull();
  });

  it("habilita exclusivamente la retirada cuando solo tiene permiso de retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.canAssignRoles()).toBe(false);
    expect(page.canRemoveRoles()).toBe(true);
    expect(page.canManageRoles()).toBe(true);
    expect(page.operationMode()).toBe("remove");

    const assignButton = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-mode-assign"]',
    );

    const removeButton = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-mode-remove"]',
    );

    expect(assignButton?.disabled).toBe(true);
    expect(removeButton?.disabled).toBe(false);

    expect(
      root.querySelector('[data-testid="bulk-page-removal-pending"]'),
    ).not.toBeNull();

    page.setOperationMode("assign");
    expect(page.operationMode()).toBe("remove");
  });

  it("habilita exclusivamente la asignacion cuando solo tiene permiso de asignacion", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
    ]);

    expect(page.canAssignRoles()).toBe(true);
    expect(page.canRemoveRoles()).toBe(false);
    expect(page.operationMode()).toBe("assign");

    expect(
      root.querySelector<HTMLButtonElement>(
        '[data-testid="bulk-page-mode-remove"]',
      )?.disabled,
    ).toBe(true);

    page.setOperationMode("remove");
    expect(page.operationMode()).toBe("assign");

    expect(
      root.querySelector('[data-testid="bulk-role-section"]'),
    ).not.toBeNull();
  });

  it("habilita ambos modos cuando el usuario tiene los permisos correspondientes", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.canAssignRoles()).toBe(true);
    expect(page.canRemoveRoles()).toBe(true);
    expect(page.operationMode()).toBe("assign");

    page.setOperationMode("remove");
    fixture.detectChanges();

    expect(page.operationMode()).toBe("remove");

    expect(
      root.querySelector('[data-testid="bulk-page-removal-pending"]'),
    ).not.toBeNull();

    page.setOperationMode("assign");
    fixture.detectChanges();

    expect(page.operationMode()).toBe("assign");
    expect(
      root.querySelector('[data-testid="bulk-role-section"]'),
    ).not.toBeNull();
  });
  it("muestra los tres pasos de retirada desde el inicio", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedRole()).toBeNull();

    const roleStep = root.querySelector(
      '[data-testid="bulk-page-role-catalog"]',
    );

    const usersStep = root.querySelector(
      '[data-testid="bulk-page-user-selection-pending"]',
    );

    const reviewStep = root.querySelector(
      '[data-testid="bulk-page-removal-review"]',
    );

    const reviewButton = reviewStep?.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(roleStep).not.toBeNull();
    expect(usersStep).not.toBeNull();
    expect(reviewStep).not.toBeNull();

    expect(reviewButton).not.toBeNull();
    expect(reviewButton!.disabled).toBe(true);

    expect(
      root.querySelector('[data-testid="bulk-page-user-selection"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-report"]'),
    ).toBeNull();
  });
  it("oculta listado de retirada hasta seleccionar rol", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedRole()).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-role-catalog"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-user-selection"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-pending"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();
  });
  it("selecciona un rol ordinario en modo retirada sin habilitar confirmacion", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.operationMode()).toBe("remove");

    const catalog = root.querySelector(
      '[data-testid="bulk-page-role-catalog"]',
    );

    expect(catalog).not.toBeNull();

    const buttons = catalog!.querySelectorAll<HTMLButtonElement>(
      '[data-testid="select-available-role"]',
    );

    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain("Consulta de Personas");

    buttons[0].click();
    fixture.detectChanges();

    expect(page.selectedRole()?.code).toBe("ROL_CONSULTA_PERSONAS");

    expect(
      root.querySelector('[data-testid="bulk-page-removal-pending"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-operation-summary"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-user-selection"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-operation-placeholder"]'),
    ).toBeNull();
  });
  it("consulta usuarios del rol con permiso exclusivo de retirada", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const service = TestBed.inject(UserService);
    const listSpy = vi.spyOn(service, "list");

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    expect(page.operationMode()).toBe("remove");

    page.selectRole(role!);

    expect(page.selectedRole()?.id).toBe(role!.id);
    expect(listSpy).toHaveBeenCalledWith(1, role!.id);
    expect(page.currentPage()).toBe(1);
  });

  it("consulta el listado general al regresar al modo asignar", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    const service = TestBed.inject(UserService);
    const listSpy = vi.spyOn(service, "list");

    page.setOperationMode("remove");

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);

    expect(listSpy).toHaveBeenCalledWith(1, role!.id);

    listSpy.mockClear();

    page.setOperationMode("assign");

    expect(page.operationMode()).toBe("assign");
    expect(page.selectedRole()).toBeNull();
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.currentPage()).toBe(1);
    expect(listSpy).toHaveBeenCalledWith(1, undefined);
  });
  it("cancela la consulta pendiente al cambiar de operacion", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    const service = TestBed.inject(UserService);
    const pending = new Subject<UserListResponse>();
    const listSpy = vi.spyOn(service, "list");

    page.setOperationMode("remove");

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");
    expect(role).toBeDefined();

    listSpy.mockReturnValueOnce(pending.asObservable());

    page.selectRole(role!);

    expect(page.usersLoading()).toBe(true);
    expect(pending.observed).toBe(true);

    listSpy.mockClear();

    page.setOperationMode("assign");

    expect(pending.observed).toBe(false);
    expect(page.operationMode()).toBe("assign");
    expect(page.usersLoading()).toBe(false);
    expect(page.selectedRole()).toBeNull();
    expect(page.currentPage()).toBe(1);
    expect(listSpy).toHaveBeenCalledWith(1, undefined);
  });

  it("cancela la consulta anterior al cambiar de rol", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const service = TestBed.inject(UserService);
    const pending = new Subject<UserListResponse>();
    const listSpy = vi.spyOn(service, "list");

    const firstRole = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");
    expect(firstRole).toBeDefined();

    const secondRole = {
      id: 4,
      code: "ROL_OTRO",
      name: "Otro rol",
    };

    page.availableRoles.set([...page.availableRoles(), secondRole]);

    listSpy.mockReturnValueOnce(pending.asObservable());

    page.selectRole(firstRole!);

    expect(page.usersLoading()).toBe(true);
    expect(pending.observed).toBe(true);

    page.selectRole(secondRole);

    expect(pending.observed).toBe(false);
    expect(page.selectedRole()?.id).toBe(secondRole.id);
    expect(page.usersLoading()).toBe(false);
    expect(page.currentPage()).toBe(1);
    expect(listSpy).toHaveBeenCalledWith(1, secondRole.id);
    expect(page.selectedUserIds()).toEqual([]);
  });
  it("libera la consulta pendiente al destruir la pagina", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const service = TestBed.inject(UserService);
    const pending = new Subject<UserListResponse>();

    const listSpy = vi.spyOn(service, "list");
    listSpy.mockReturnValueOnce(pending.asObservable());

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);

    expect(page.usersLoading()).toBe(true);
    expect(pending.observed).toBe(true);

    fixture.destroy();

    expect(pending.observed).toBe(false);
    expect(page.usersLoading()).toBe(false);

    expect(listSpy).toHaveBeenCalledWith(1, role!.id);
  });
  it("impide seleccionar usuarios en retirada sin rol", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const first = user(1);

    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedRole()).toBeNull();
    expect(page.selectedUserIds()).toEqual([]);
  });

  it("selecciona y excluye usuarios desde las casillas en retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const roleButton = root.querySelector<HTMLButtonElement>(
      '[data-testid="select-available-role"]',
    );

    expect(roleButton).not.toBeNull();
    roleButton!.click();

    const linked = user(1);
    const unlinked = user(2, false);

    page.users.set([linked, unlinked]);
    fixture.detectChanges();

    const checkboxes = root.querySelectorAll<HTMLInputElement>(
      '[data-testid="bulk-user-checkbox"]',
    );

    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].disabled).toBe(false);
    expect(checkboxes[1].disabled).toBe(true);

    checkboxes[0].checked = true;
    checkboxes[0].dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(page.selectedUserIds()).toEqual([1]);
    expect(checkboxes[0].checked).toBe(true);

    const preview = root.querySelector(
      '[data-testid="bulk-page-selection-preview"]',
    );

    expect(preview).not.toBeNull();

    checkboxes[0].checked = false;
    checkboxes[0].dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(page.selectedUserIds()).toEqual([]);
    expect(checkboxes[0].checked).toBe(false);

    expect(
      root.querySelector('[data-testid="bulk-page-selection-preview"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();
  });

  it("limpia la seleccion visual al cambiar de rol en retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const otherRole = {
      id: 4,
      code: "ROL_OTRO",
      name: "Otro rol",
    };

    page.availableRoles.set([...page.availableRoles(), otherRole]);
    fixture.detectChanges();

    const roleButtons = root.querySelectorAll<HTMLButtonElement>(
      '[data-testid="select-available-role"]',
    );

    expect(roleButtons.length).toBe(2);

    roleButtons[0].click();

    page.users.set([user(1)]);
    fixture.detectChanges();

    const checkbox = root.querySelector<HTMLInputElement>(
      '[data-testid="bulk-user-checkbox"]',
    );

    expect(checkbox).not.toBeNull();

    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(page.selectedUserIds()).toEqual([1]);

    roleButtons[1].click();
    fixture.detectChanges();

    expect(page.selectedRole()?.id).toBe(otherRole.id);
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedUsers()).toEqual([]);

    expect(
      root.querySelector('[data-testid="bulk-page-selection-preview"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();
  });
  it("permite preparar seleccion de retirada con rol y permiso", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedRole()?.id).toBe(role!.id);
    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.bulkConfirmationOpen()).toBe(false);
  });
  it("permite seleccionar usuarios vinculados a Personas", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);

    page.updateSelection({ user: first, selected: true });

    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.selectedUsers()).toEqual([first]);
  });

  it("conserva seleccionados de paginas anteriores y permite excluirlos", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    const second = user(2);

    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    page.users.set([second]);
    page.currentPage.set(2);
    page.updateSelection({ user: second, selected: true });

    expect(page.selectedUserIds()).toEqual([1, 2]);

    page.updateSelection({ user: first, selected: false });

    expect(page.selectedUserIds()).toEqual([2]);
    expect(page.selectedUsers()).toEqual([second]);
  });

  it("rechaza usuarios sin Persona vinculada", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const unlinked = user(3, false);
    page.users.set([unlinked]);

    page.updateSelection({
      user: unlinked,
      selected: true,
    });

    expect(page.selectedUserIds()).toEqual([]);
  });

  it("impide seleccionar mas de cien usuarios", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const existing = Array.from({ length: 100 }, (_, index) => user(index + 1));

    page.selectedUserIds.set(existing.map((item) => item.id));
    page.selectedUsers.set(existing);

    const extra = user(101);
    page.users.set([extra]);

    page.updateSelection({ user: extra, selected: true });

    expect(page.selectedUserIds()).toHaveLength(100);
    expect(page.selectedUserIds()).not.toContain(101);
  });

  it("no permite seleccionar usuarios sin permisos", async () => {
    await render(["roles.ver"]);

    const first = user(1);
    page.users.set([first]);

    page.updateSelection({ user: first, selected: true });

    expect(page.selectedUserIds()).toEqual([]);
  });
  it("limpia la operacion pendiente al cambiar de asignar a retirar", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);
    const first = user(1);

    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page
      .availableRoles()
      .find((candidate) => candidate.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);
    page.openBulkConfirmation();
    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    expect(page.bulkConfirmationOpen()).toBe(true);
    expect(page.selectedUserIds()).toEqual([first.id]);
    expect(page.selectedRole()?.id).toBe(role!.id);

    page.setOperationMode("remove");
    fixture.detectChanges();

    expect(page.operationMode()).toBe("remove");
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedUsers()).toEqual([]);
    expect(page.selectedRole()).toBeNull();
    expect(page.bulkResult()).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-pending"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-confirmation"]'),
    ).toBeNull();

    page.confirmBulkAssignment();

    expect(page.bulkProcessing()).toBe(false);

    page.setOperationMode("assign");
    fixture.detectChanges();

    expect(page.operationMode()).toBe("assign");
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedRole()).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-role-section"]'),
    ).not.toBeNull();
  });

  it("impide cambiar de operacion durante el procesamiento", async () => {
    await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    page.bulkProcessing.set(true);

    page.setOperationMode("remove");

    expect(page.operationMode()).toBe("assign");
    expect(page.bulkProcessing()).toBe(true);

    page.bulkProcessing.set(false);
    page.setOperationMode("remove");

    expect(page.operationMode()).toBe("remove");
  });
  it("impide abrir confirmacion de asignacion en modo retirada", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    page.setOperationMode("remove");

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedUserIds()).toEqual([1]);

    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.bulkProcessing()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.selectedRole()?.id).toBe(role!.id);
  });
  it("rechaza confirmacion de retirada sin usuarios seleccionados", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    page.openBulkRemovalConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
  });

  it("muestra errores administrativos en retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    page.bulkError.set("Laravel rechazó la retirada.");
    fixture.detectChanges();

    const error = root.querySelector('[data-testid="bulk-page-removal-error"]');

    expect(error).not.toBeNull();
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.textContent).toContain("Laravel rechazó la retirada.");

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();
  });

  it("muestra avisos administrativos en retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    page.bulkNotice.set("Laravel confirmó una retirada.");
    fixture.detectChanges();

    const notice = root.querySelector(
      '[data-testid="bulk-page-removal-notice"]',
    );

    expect(notice).not.toBeNull();
    expect(notice?.getAttribute("role")).toBe("status");
    expect(notice?.textContent).toContain("Laravel confirmó una retirada.");

    expect(
      root.querySelector('[data-testid="bulk-page-confirm-assignment"]'),
    ).toBeNull();
  });
  it("mantiene visible la revision sin usuarios y bloquea la confirmacion", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);
    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-review"]'),
    ).not.toBeNull();
    const button = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(true);
  });

  it("muestra revisar retirada despues del personal seleccionado", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    fixture.detectChanges();

    const preview = root.querySelector(
      '[data-testid="bulk-page-selection-preview"]',
    );

    const review = root.querySelector(
      '[data-testid="bulk-page-removal-review"]',
    );

    const button = review?.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(preview).not.toBeNull();
    expect(review).not.toBeNull();
    expect(button).not.toBeNull();

    expect(
      preview!.compareDocumentPosition(review!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    button!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(true);

    expect(
      root.querySelector('[data-dialog="bulk-removal-dialog"]'),
    ).not.toBeNull();
  });
  it("abre y cancela la confirmacion administrativa de retirada", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    fixture.detectChanges();

    const open = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(open).not.toBeNull();
    open!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(true);
    expect(
      root.querySelector('[data-testid="bulk-page-confirmation"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-confirm-assignment"]'),
    ).toBeNull();

    const cancel = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-cancel-confirmation"]',
    );

    expect(cancel).not.toBeNull();
    cancel!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.selectedRole()?.id).toBe(role!.id);

    expect(
      root.querySelector('[data-testid="bulk-page-open-removal-review"]'),
    ).not.toBeNull();
  });
  it("invalida revision de retirada al excluir un usuario", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    fixture.detectChanges();

    const open = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(open).not.toBeNull();
    open!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(true);

    page.updateSelection({ user: selected, selected: false });
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([]);

    expect(
      root.querySelector('[data-testid="bulk-page-removal-review-open"]'),
    ).toBeNull();

    const review = root.querySelector(
      '[data-testid="bulk-page-removal-review"]',
    );

    const button = review?.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(review).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(true);
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(
      root.querySelector('[data-dialog="bulk-removal-dialog"]'),
    ).toBeNull();
  });

  it("invalida revision de retirada al cambiar de rol", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const firstRole = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(firstRole).toBeDefined();
    page.selectRole(firstRole!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    fixture.detectChanges();

    const open = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(open).not.toBeNull();
    open!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(true);

    const secondRole = {
      id: 4,
      code: "ROL_OTRO",
      name: "Otro rol",
    };

    page.availableRoles.set([...page.availableRoles(), secondRole]);
    page.selectRole(secondRole);
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedRole()?.id).toBe(secondRole.id);
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedUsers()).toEqual([]);

    expect(
      root.querySelector('[data-testid="bulk-page-removal-review-open"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-open-confirmation"]'),
    ).toBeNull();
  });
  it("abre confirmacion de retirada con lote valido", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    page.openBulkRemovalConfirmation();

    expect(page.operationMode()).toBe("remove");
    expect(page.selectedRole()?.id).toBe(role!.id);
    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.bulkConfirmationOpen()).toBe(true);
    expect(page.bulkProcessing()).toBe(false);
  });

  it("impide abrir confirmacion de retirada en modo asignacion", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    page.openBulkRemovalConfirmation();

    expect(page.operationMode()).toBe("assign");
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1]);
  });

  it("impide confirmar retirada de rol administrativo protegido", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const protectedRole = {
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del sistema",
    };

    page.selectedRole.set(protectedRole);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    page.openBulkRemovalConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
  });
  it("no ejecuta retirada masiva sin confirmacion abierta", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page.availableRoles()[0];
    page.selectRole(role);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    const removalSpy = vi.spyOn(
      TestBed.inject(UserRoleService),
      "removeRolesBulk",
    );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkRemoval();

    expect(removalSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1]);
  });

  it("ejecuta retirada desde el formulario y muestra reporte nominal", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);

    const selected = user(1);

    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    fixture.detectChanges();

    const openButton = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-open-removal-review"]',
    );

    expect(openButton).not.toBeNull();
    openButton!.click();
    fixture.detectChanges();

    expect(page.bulkConfirmationOpen()).toBe(true);

    const passwordInput = root.querySelector<HTMLInputElement>(
      '[data-testid="user-role-reauthentication-password"]',
    );

    const confirmButton = root.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-confirm-removal"]',
    );

    expect(passwordInput).not.toBeNull();
    expect(confirmButton).not.toBeNull();
    expect(confirmButton!.disabled).toBe(true);

    const pending = new Subject<void>();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(pending.asObservable());

    const removalSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "removeRolesBulk")
      .mockReturnValue(
        of({
          role_id: role!.id,
          result: {
            selected: 1,
            removed: 1,
            already_absent: 0,
            removed_user_ids: [selected.id],
            already_absent_user_ids: [],
          },
        }),
      );

    expect(authSpy).not.toHaveBeenCalled();
    expect(removalSpy).not.toHaveBeenCalled();

    passwordInput!.value = "ClaveTemporalDePrueba";
    passwordInput!.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    expect(page.bulkReauthenticationForm.valid).toBe(true);
    expect(confirmButton!.disabled).toBe(false);

    confirmButton!.click();
    fixture.detectChanges();

    expect(authSpy).toHaveBeenCalledExactlyOnceWith("ClaveTemporalDePrueba");
    expect(removalSpy).not.toHaveBeenCalled();

    expect(page.bulkProcessing()).toBe(true);
    expect(page.bulkConfirmationOpen()).toBe(true);
    expect(confirmButton!.disabled).toBe(true);

    pending.next();
    pending.complete();
    fixture.detectChanges();

    expect(removalSpy).toHaveBeenCalledExactlyOnceWith(role!.id, [selected.id]);

    expect(page.bulkProcessing()).toBe(false);
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedRole()).toBeNull();
    expect(page.selectedUserIds()).toEqual([]);

    const report = root.querySelector(
      '[data-testid="bulk-page-removal-report"]',
    );

    expect(report).not.toBeNull();
    expect(report?.textContent).toContain(selected.email);
    expect(report?.textContent).toContain(role!.name);

    expect(
      root
        .querySelector('[data-testid="bulk-removal-removed-count"]')
        ?.textContent?.trim(),
    ).toBe("1");

    expect(
      root.querySelector('[data-testid="bulk-page-confirm-removal"]'),
    ).toBeNull();

    expect(page.bulkRemovalResult()?.removedUsers).toEqual([selected]);
    expect(page.bulkResult()).toBeNull();
  });
  it("espera reautenticacion antes de ejecutar retirada masiva", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page.availableRoles()[0];
    page.selectRole(role);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });

    page.openBulkRemovalConfirmation();

    const pending = new Subject<void>();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(pending.asObservable());

    const removalSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "removeRolesBulk")
      .mockReturnValue(
        of({
          role_id: role.id,
          result: {
            selected: 1,
            removed: 1,
            already_absent: 0,
            removed_user_ids: [selected.id],
            already_absent_user_ids: [],
          },
        }),
      );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkRemoval();

    expect(authSpy).toHaveBeenCalledExactlyOnceWith("ClaveTemporalDePrueba");
    expect(removalSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(true);

    pending.next();
    pending.complete();

    expect(removalSpy).toHaveBeenCalledExactlyOnceWith(role.id, [selected.id]);

    expect(page.bulkProcessing()).toBe(false);
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedRole()).toBeNull();

    expect(page.bulkRemovalResult()).toEqual({
      role,
      selected: 1,
      removed: 1,
      alreadyAbsent: 0,
      removedUsers: [selected],
      alreadyAbsentUsers: [],
    });
  });
  it("no ejecuta retirada cuando falla la reautenticacion", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page.availableRoles()[0];
    page.selectRole(role);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    page.openBulkRemovalConfirmation();

    const pending = new Subject<void>();

    vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
      pending.asObservable(),
    );

    const removalSpy = vi.spyOn(
      TestBed.inject(UserRoleService),
      "removeRolesBulk",
    );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkRemoval();

    expect(removalSpy).not.toHaveBeenCalled();

    pending.error(new Error("Reautenticacion rechazada"));

    expect(removalSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(false);
    expect(page.bulkConfirmationOpen()).toBe(true);
    expect(page.selectedUserIds()).toEqual([selected.id]);
    expect(page.selectedRole()?.id).toBe(role.id);
    expect(page.bulkRemovalResult()).toBeNull();
    expect(page.bulkError()).toContain("contraseña administrativa");
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
    expect(page.bulkReauthenticationForm.controls.password.enabled).toBe(true);
  });

  for (const status of [403, 422, 423, 0]) {
    it(`conserva el lote de retirada ante errores HTTP ${status}`, async () => {
      await render([
        "usuarios.ver",
        "roles.ver",
        "usuarios.retirar_roles_masivamente",
      ]);

      const role = page.availableRoles()[0];
      page.selectRole(role);

      const selected = user(1);
      page.users.set([selected]);
      page.updateSelection({ user: selected, selected: true });
      page.openBulkRemovalConfirmation();

      vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
        of(void 0),
      );

      const pending = new Subject<{
        role_id: number;
        result: {
          selected: number;
          removed: number;
          already_absent: number;
          removed_user_ids: number[];
          already_absent_user_ids: number[];
        };
      }>();

      const removalSpy = vi
        .spyOn(TestBed.inject(UserRoleService), "removeRolesBulk")
        .mockReturnValue(pending.asObservable());

      page.bulkReauthenticationForm.controls.password.setValue(
        "ClaveTemporalDePrueba",
      );

      page.confirmBulkRemoval();

      expect(removalSpy).toHaveBeenCalledExactlyOnceWith(role.id, [
        selected.id,
      ]);
      expect(page.bulkProcessing()).toBe(true);

      pending.error(new HttpErrorResponse({ status }));

      expect(page.bulkProcessing()).toBe(false);
      expect(page.bulkConfirmationOpen()).toBe(true);
      expect(page.selectedRole()?.id).toBe(role.id);
      expect(page.selectedUserIds()).toEqual([selected.id]);
      expect(page.bulkRemovalResult()).toBeNull();
      expect(page.bulkError()).toBeTruthy();
      expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
      expect(page.bulkReauthenticationForm.controls.password.enabled).toBe(
        true,
      );
    });
  }

  it("impide dos envios masivos de retirada simultaneos", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page.availableRoles()[0];
    page.selectRole(role);

    const selected = user(1);
    page.users.set([selected]);
    page.updateSelection({ user: selected, selected: true });
    page.openBulkRemovalConfirmation();

    const pending = new Subject<void>();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(pending.asObservable());

    const removalSpy = vi.spyOn(
      TestBed.inject(UserRoleService),
      "removeRolesBulk",
    );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkRemoval();
    page.confirmBulkRemoval();

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(removalSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(true);
    expect(page.selectedUserIds()).toEqual([selected.id]);

    pending.error(new Error("Prueba finalizada"));

    expect(page.bulkProcessing()).toBe(false);
  });
  it("limpia el reporte de retirada al cambiar de operacion", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.asignar_roles",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.setOperationMode("remove");

    page.bulkRemovalResult.set({
      role: role!,
      selected: 1,
      removed: 1,
      alreadyAbsent: 0,
      removedUsers: [user(1)],
      alreadyAbsentUsers: [],
    });

    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-report"]'),
    ).not.toBeNull();

    page.setOperationMode("assign");
    fixture.detectChanges();

    expect(page.bulkRemovalResult()).toBeNull();

    page.setOperationMode("remove");
    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="bulk-page-removal-report"]'),
    ).toBeNull();

    expect(page.bulkResult()).toBeNull();
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedRole()).toBeNull();
  });
  it("oculta el reporte nominal de retirada antes de recibir resultados", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    expect(page.bulkRemovalResult()).toBeNull();
    expect(
      root.querySelector('[data-testid="bulk-page-removal-report"]'),
    ).toBeNull();
  });

  it("presenta el reporte nominal de retirada por separado", async () => {
    const root = await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    const removedUser = user(1);
    const absentUser = user(2);

    page.bulkRemovalResult.set({
      role: role!,
      selected: 2,
      removed: 1,
      alreadyAbsent: 1,
      removedUsers: [removedUser],
      alreadyAbsentUsers: [absentUser],
    });

    fixture.detectChanges();

    const report = root.querySelector(
      '[data-testid="bulk-page-removal-report"]',
    );

    expect(report).not.toBeNull();

    const review = root.querySelector(
      '[data-testid="bulk-page-removal-review"]',
    );

    expect(review).not.toBeNull();

    expect(
      review!.compareDocumentPosition(report!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(report?.textContent).toContain(role!.name);

    expect(
      root
        .querySelector('[data-testid="bulk-removal-selected-count"]')
        ?.textContent?.trim(),
    ).toBe("2");

    expect(
      root
        .querySelector('[data-testid="bulk-removal-removed-count"]')
        ?.textContent?.trim(),
    ).toBe("1");

    expect(
      root
        .querySelector('[data-testid="bulk-removal-absent-count"]')
        ?.textContent?.trim(),
    ).toBe("1");

    const removedSection = root.querySelector(
      '[data-testid="bulk-removal-removed-users"]',
    );

    const absentSection = root.querySelector(
      '[data-testid="bulk-removal-already-absent-users"]',
    );

    expect(removedSection?.textContent).toContain(removedUser.email);
    expect(removedSection?.textContent).not.toContain(absentUser.email);

    expect(absentSection?.textContent).toContain(absentUser.email);
    expect(absentSection?.textContent).not.toContain(removedUser.email);

    expect(
      root.querySelector('[data-testid="bulk-page-detailed-result"]'),
    ).toBeNull();

    expect(
      root.querySelector('[data-testid="bulk-page-confirm-assignment"]'),
    ).toBeNull();
  });
  it("conserva reporte nominal de retirada y restaura el estado", async () => {
    await render([
      "usuarios.ver",
      "roles.ver",
      "usuarios.retirar_roles_masivamente",
    ]);

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();
    page.selectRole(role!);

    const first = user(1);
    const second = user(2);

    page.users.set([first, second]);
    page.updateSelection({ user: first, selected: true });
    page.updateSelection({ user: second, selected: true });

    page.openBulkRemovalConfirmation();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(of(void 0));

    const removalSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "removeRolesBulk")
      .mockReturnValue(
        of({
          role_id: role!.id,
          result: {
            selected: 2,
            removed: 1,
            already_absent: 1,
            removed_user_ids: [first.id],
            already_absent_user_ids: [second.id],
          },
        }),
      );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkRemoval();

    expect(authSpy).toHaveBeenCalledExactlyOnceWith("ClaveTemporalDePrueba");

    expect(removalSpy).toHaveBeenCalledExactlyOnceWith(role!.id, [
      first.id,
      second.id,
    ]);

    expect(page.bulkRemovalResult()).toEqual({
      role,
      selected: 2,
      removed: 1,
      alreadyAbsent: 1,
      removedUsers: [first],
      alreadyAbsentUsers: [second],
    });

    expect(page.bulkResult()).toBeNull();
    expect(page.bulkProcessing()).toBe(false);
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedUsers()).toEqual([]);
    expect(page.selectedRole()).toBeNull();
    expect(page.users()).toEqual([]);
    expect(page.currentPage()).toBe(1);
    expect(page.bulkNotice()).toContain("1 retiradas");
    expect(page.bulkError()).toBeNull();
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
    expect(page.bulkReauthenticationForm.controls.password.enabled).toBe(true);
  });
  it("abre confirmacion con un rol valido y usuarios vinculados", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page
      .availableRoles()
      .find((item) => item.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);
    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(true);
  });

  it("rechaza confirmacion sin usuarios seleccionados", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const role = page.availableRoles()[0];
    page.selectRole(role);

    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
  });

  it("rechaza confirmar roles administrativos protegidos", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    page.selectedRole.set({
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador del Sistema",
    });

    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
  });

  it("limpia la contrasena al cancelar confirmacion", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    page.selectRole(page.availableRoles()[0]);
    page.openBulkConfirmation();

    page.bulkReauthenticationForm.controls.password.setValue("Temporal123!");
    page.cancelBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
  });

  it("invalida confirmacion al excluir usuarios", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    page.selectRole(page.availableRoles()[0]);
    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(true);

    page.updateSelection({ user: first, selected: false });

    expect(page.bulkConfirmationOpen()).toBe(false);
  });
  it("invalida confirmacion al agregar otro usuario", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    const second = user(2);

    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    page.selectRole(page.availableRoles()[0]);
    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(true);

    page.users.set([second]);
    page.updateSelection({ user: second, selected: true });

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1, 2]);
  });

  it("invalida confirmacion al cambiar el rol", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const firstRole = page.availableRoles()[0];

    page.selectRole(firstRole);
    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(true);

    const secondRole = {
      id: 10,
      code: "ROL_OTRO",
      name: "Otro rol",
    };

    page.availableRoles.set([firstRole, secondRole]);
    page.selectRole(secondRole);

    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.selectedRole()?.id).toBe(10);
  });

  it("bloquea cambios de usuarios durante procesamiento", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    const second = user(2);

    page.users.set([first, second]);
    page.updateSelection({ user: first, selected: true });

    page.bulkProcessing.set(true);

    page.updateSelection({ user: second, selected: true });
    page.updateSelection({ user: first, selected: false });

    expect(page.selectedUserIds()).toEqual([1]);
  });
  it("conserva reporte nominal de asignados y usuarios con rol previo", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
    ]);

    const first = user(1);
    const second = {
      ...user(2),
      roles: [
        {
          id: 3,
          code: "ROL_CONSULTA_PERSONAS",
          name: "Consulta de Personas",
        },
      ],
    };
    const third = user(3);

    page.users.set([first, second, third]);
    page.updateSelection({ user: first, selected: true });
    page.updateSelection({ user: second, selected: true });

    const role = page
      .availableRoles()
      .find((available) => available.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);
    page.openBulkConfirmation();
    fixture.detectChanges();

    // Reproduce el filtro que ocultaba usuarios al confirmar.
    const columnSearch = root.querySelector<HTMLInputElement>(
      '[data-testid="users-column-name"]',
    );

    expect(columnSearch).not.toBeNull();

    columnSearch!.value = first.email;
    columnSearch!.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelectorAll('[data-testid="user-row"]')).toHaveLength(1);

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(of(void 0));

    const assignmentSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "assignRolesBulk")
      .mockReturnValue(
        of({
          role_id: role!.id,
          result: {
            selected: 2,
            assigned: 1,
            already_assigned: 1,
            assigned_user_ids: [first.id],
            already_assigned_user_ids: [second.id],
          },
        }),
      );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkAssignment();
    fixture.detectChanges();

    expect(authSpy).toHaveBeenCalledExactlyOnceWith("ClaveTemporalDePrueba");

    expect(assignmentSpy).toHaveBeenCalledExactlyOnceWith(role!.id, [
      first.id,
      second.id,
    ]);

    expect(page.selectedUserIds()).toEqual([]);
    expect(page.selectedUsers()).toEqual([]);
    expect(page.selectedRole()).toBeNull();
    expect(page.bulkProcessing()).toBe(false);

    // El filtro no debe permanecer activo después de la confirmación.
    expect(columnSearch!.value).toBe("");
    expect(root.querySelectorAll('[data-testid="user-row"]')).toHaveLength(3);

    const visibleUsers = page.users();
    const updatedFirst = visibleUsers.find((entry) => entry.id === first.id);
    const updatedSecond = visibleUsers.find((entry) => entry.id === second.id);
    const unchangedThird = visibleUsers.find((entry) => entry.id === third.id);

    expect(
      updatedFirst?.roles?.filter((entry) => entry.id === role!.id),
    ).toHaveLength(1);

    expect(
      updatedSecond?.roles?.filter((entry) => entry.id === role!.id),
    ).toHaveLength(1);

    expect(unchangedThird?.roles ?? []).toEqual([]);

    const report = page.bulkResult();

    expect(report).not.toBeNull();
    expect(report?.role.code).toBe("ROL_CONSULTA_PERSONAS");
    expect(report?.selected).toBe(2);
    expect(report?.assigned).toBe(1);
    expect(report?.alreadyAssigned).toBe(1);
    expect(report?.assignedUsers.map((entry) => entry.id)).toEqual([1]);
    expect(report?.alreadyAssignedUsers.map((entry) => entry.id)).toEqual([2]);

    const panel = root.querySelector(
      '[data-testid="bulk-page-detailed-result"]',
    );

    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain("ROL_CONSULTA_PERSONAS");
    expect(panel?.textContent).toContain("Consulta de Personas");

    const assignedList = root.querySelector(
      '[data-testid="bulk-page-assigned-users"]',
    );

    const alreadyAssignedList = root.querySelector(
      '[data-testid="bulk-page-already-assigned-users"]',
    );

    expect(assignedList?.textContent).toContain(first.name);
    expect(assignedList?.textContent).not.toContain(second.name);

    expect(alreadyAssignedList?.textContent).toContain(second.name);
    expect(alreadyAssignedList?.textContent).not.toContain(first.name);

    fixture.detectChanges();

    expect(
      root.querySelector('[data-testid="bulk-page-detailed-result"]'),
    ).not.toBeNull();
  });
  it("retira el indicador a los ocho segundos y conserva el reporte", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
    ]);

    const first = user(1);
    const second = user(2);
    const unrelated = user(3);

    page.users.set([first, second, unrelated]);
    page.updateSelection({ user: first, selected: true });
    page.updateSelection({ user: second, selected: true });

    const role = page
      .availableRoles()
      .find((candidate) => candidate.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);
    page.openBulkConfirmation();

    vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
      of(void 0),
    );

    vi.spyOn(
      TestBed.inject(UserRoleService),
      "assignRolesBulk",
    ).mockReturnValue(
      of({
        role_id: role!.id,
        result: {
          selected: 2,
          assigned: 1,
          already_assigned: 1,
          assigned_user_ids: [first.id],
          already_assigned_user_ids: [second.id],
        },
      }),
    );

    vi.useFakeTimers();

    try {
      page.bulkReauthenticationForm.controls.password.setValue(
        "ClaveTemporalDePrueba",
      );

      page.confirmBulkAssignment();
      fixture.detectChanges();

      expect(page.highlightedUserIds()).toEqual([1, 2]);

      const rows = root.querySelectorAll('[data-testid="user-row"]');

      expect(rows).toHaveLength(3);

      const highlight = (index: number) =>
        (rows[index].querySelector("td") as HTMLElement).style.boxShadow;

      expect(highlight(0)).toContain("inset 3px");
      expect(highlight(1)).toContain("inset 3px");
      expect(highlight(2)).toBe("");

      vi.advanceTimersByTime(7999);
      fixture.detectChanges();

      expect(page.highlightedUserIds()).toEqual([1, 2]);

      vi.advanceTimersByTime(1);
      fixture.detectChanges();

      expect(page.highlightedUserIds()).toEqual([]);
      expect(highlight(0)).toBe("");
      expect(highlight(1)).toBe("");
      expect(highlight(2)).toBe("");

      expect(page.bulkResult()?.assigned).toBe(1);
      expect(page.bulkResult()?.alreadyAssigned).toBe(1);

      expect(
        root.querySelector('[data-testid="bulk-page-detailed-result"]'),
      ).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it("mantiene la etapa de confirmacion visible durante todo el flujo", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
    ]);

    const placeholder = () =>
      root.querySelector('[data-testid="bulk-page-operation-placeholder"]');

    const summary = () =>
      root.querySelector('[data-testid="bulk-page-operation-summary"]');

    const confirmation = () =>
      root.querySelector('[data-testid="bulk-page-confirmation"]');

    const detailedResult = () =>
      root.querySelector('[data-testid="bulk-page-detailed-result"]');

    expect(placeholder()).not.toBeNull();
    expect(placeholder()?.textContent).toContain(
      "Selecciona un rol y al menos un usuario",
    );
    expect(summary()).toBeNull();
    expect(confirmation()).toBeNull();
    expect(detailedResult()).toBeNull();

    const first = user(1);

    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page
      .availableRoles()
      .find((candidate) => candidate.code === "ROL_CONSULTA_PERSONAS");

    expect(role).toBeDefined();

    page.selectRole(role!);
    fixture.detectChanges();

    expect(placeholder()).toBeNull();
    expect(summary()).not.toBeNull();
    expect(summary()?.textContent).toContain("ROL_CONSULTA_PERSONAS");
    expect(confirmation()).toBeNull();

    page.openBulkConfirmation();
    fixture.detectChanges();

    expect(summary()).not.toBeNull();
    expect(confirmation()).not.toBeNull();
    expect(
      root.querySelector('[data-testid="user-role-reauthentication-password"]'),
    ).not.toBeNull();

    vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
      of(void 0),
    );

    vi.spyOn(
      TestBed.inject(UserRoleService),
      "assignRolesBulk",
    ).mockReturnValue(
      of({
        role_id: role!.id,
        result: {
          selected: 1,
          assigned: 1,
          already_assigned: 0,
          assigned_user_ids: [first.id],
          already_assigned_user_ids: [],
        },
      }),
    );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkAssignment();
    fixture.detectChanges();

    expect(page.bulkProcessing()).toBe(false);
    expect(page.bulkConfirmationOpen()).toBe(false);
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");

    expect(summary()).toBeNull();
    expect(confirmation()).toBeNull();
    expect(
      root.querySelector('[data-testid="user-role-reauthentication-password"]'),
    ).toBeNull();

    expect(placeholder()).not.toBeNull();
    expect(placeholder()?.textContent).toContain(
      "La última operación concluyó",
    );

    expect(detailedResult()).not.toBeNull();
    expect(detailedResult()?.textContent).toContain("ROL_CONSULTA_PERSONAS");
    expect(
      root.querySelector('[data-testid="bulk-page-assigned-users"]')
        ?.textContent,
    ).toContain(first.name);
  });
  it("espera reautenticacion antes de enviar el lote", async () => {
    const root = await render([
      "usuarios.asignar_roles",
      "usuarios.ver",
      "roles.ver",
    ]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page.availableRoles()[0];
    page.selectRole(role);
    page.openBulkConfirmation();

    expect(page.bulkConfirmationOpen()).toBe(true);

    const authentication = new Subject<void>();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(authentication.asObservable());

    const assignmentSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "assignRolesBulk")
      .mockReturnValue(
        of({
          role_id: role.id,
          result: {
            selected: 1,
            assigned: 1,
            already_assigned: 0,
            assigned_user_ids: [first.id],
            already_assigned_user_ids: [],
          },
        }),
      );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkAssignment();

    expect(authSpy).toHaveBeenCalledExactlyOnceWith("ClaveTemporalDePrueba");
    expect(assignmentSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(true);

    authentication.next();
    authentication.complete();

    expect(assignmentSpy).toHaveBeenCalledExactlyOnceWith(role.id, [1]);
    expect(page.bulkProcessing()).toBe(false);
    expect(page.selectedUserIds()).toEqual([]);
    expect(page.bulkNotice()).toContain("Laravel confirmó 1 asignaciones");
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
  });

  const errorScenarios = [
    { status: 403, expected: "autorización" },
    { status: 422, expected: "rechazó el lote" },
    { status: 423, expected: "caducado" },
    { status: 0, expected: "Comprueba el resultado" },
  ];

  for (const scenario of errorScenarios) {
    it(`conserva el lote ante error HTTP ${scenario.status}`, async () => {
      await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

      const selected = user(1);
      page.users.set([selected]);
      page.updateSelection({ user: selected, selected: true });

      const role = page.availableRoles()[0];
      page.selectRole(role);
      page.openBulkConfirmation();

      vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
        of(void 0),
      );

      const assignment = new Subject<{
        role_id: number;
        result: {
          selected: number;
          assigned: number;
          already_assigned: number;
          assigned_user_ids: number[];
          already_assigned_user_ids: number[];
        };
      }>();

      const assignmentSpy = vi
        .spyOn(TestBed.inject(UserRoleService), "assignRolesBulk")
        .mockReturnValue(assignment.asObservable());

      page.bulkReauthenticationForm.controls.password.setValue(
        "ClaveTemporalDePrueba",
      );

      page.confirmBulkAssignment();

      expect(assignmentSpy).toHaveBeenCalledExactlyOnceWith(role.id, [1]);
      expect(page.bulkProcessing()).toBe(true);

      assignment.error(
        new HttpErrorResponse({
          status: scenario.status,
          statusText: "Error simulado",
        }),
      );

      expect(page.bulkProcessing()).toBe(false);
      expect(page.selectedUserIds()).toEqual([1]);
      expect(page.selectedRole()?.id).toBe(role.id);
      expect(page.bulkError()).toContain(scenario.expected);
      expect(page.bulkNotice()).toBeNull();
      expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
    });
  }
  it("impide dos envios masivos simultaneos", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page.availableRoles()[0];
    page.selectRole(role);
    page.openBulkConfirmation();

    const assignment = new Subject<{
      role_id: number;
      result: {
        selected: number;
        assigned: number;
        already_assigned: number;
        assigned_user_ids: number[];
        already_assigned_user_ids: number[];
      };
    }>();

    const authSpy = vi
      .spyOn(TestBed.inject(AuthService), "reauthenticate")
      .mockReturnValue(of(void 0));

    const assignmentSpy = vi
      .spyOn(TestBed.inject(UserRoleService), "assignRolesBulk")
      .mockReturnValue(assignment.asObservable());

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkAssignment();
    page.confirmBulkAssignment();

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(assignmentSpy).toHaveBeenCalledTimes(1);
    expect(page.bulkProcessing()).toBe(true);
    expect(page.selectedUserIds()).toEqual([1]);

    assignment.next({
      role_id: role.id,
      result: {
        selected: 1,
        assigned: 1,
        already_assigned: 0,
        assigned_user_ids: [first.id],
        already_assigned_user_ids: [],
      },
    });
    assignment.complete();

    expect(page.bulkProcessing()).toBe(false);
    expect(page.selectedUserIds()).toEqual([]);
  });
  it("no asigna si la reautenticacion falla y conserva el lote", async () => {
    await render(["usuarios.asignar_roles", "usuarios.ver", "roles.ver"]);

    const first = user(1);
    page.users.set([first]);
    page.updateSelection({ user: first, selected: true });

    const role = page.availableRoles()[0];
    page.selectRole(role);
    page.openBulkConfirmation();

    const authentication = new Subject<void>();

    vi.spyOn(TestBed.inject(AuthService), "reauthenticate").mockReturnValue(
      authentication.asObservable(),
    );

    const assignmentSpy = vi.spyOn(
      TestBed.inject(UserRoleService),
      "assignRolesBulk",
    );

    page.bulkReauthenticationForm.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    page.confirmBulkAssignment();

    authentication.error(new Error("Credenciales rechazadas"));

    expect(assignmentSpy).not.toHaveBeenCalled();
    expect(page.bulkProcessing()).toBe(false);
    expect(page.selectedUserIds()).toEqual([1]);
    expect(page.selectedRole()?.id).toBe(role.id);
    expect(page.bulkError()).toContain("contraseña administrativa");
    expect(page.bulkReauthenticationForm.controls.password.value).toBe("");
  });
});
