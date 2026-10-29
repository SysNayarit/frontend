import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { of, Subject } from "rxjs";
import { UserRoleService } from "../../../user-role.service";
import { UserService } from "../../../user.service";
import { UserSummary } from "../../../user.models";
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
      root.querySelector('[data-testid="bulk-page-admin-password"]'),
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
      root.querySelector('[data-testid="bulk-page-admin-password"]'),
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
