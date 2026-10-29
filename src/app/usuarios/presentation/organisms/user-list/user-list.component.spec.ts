import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSummary } from "../../../user.models";
import { UserListComponent } from "./user-list.component";

describe("UserListComponent", () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;

  const users: UserSummary[] = [
    {
      id: 1,
      id_persona: null,
      name: "Administrador inicial",
      email: "admin@example.test",
      created_at: "2026-10-26T12:00:00Z",
      person: null,
    },
    {
      id: 2,
      id_persona: "00000000-0000-4000-8000-000000000001",
      name: "Usuario de prueba",
      email: "usuario@example.test",
      created_at: "2026-10-27T09:30:00Z",
      person: {
        id_persona: "00000000-0000-4000-8000-000000000001",
        nombres: "María",
        apellido_paterno: "López",
        apellido_materno: "Pérez",
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it("muestra nombres y correos de los usuarios", () => {
    component.users = users;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Administrador inicial");
    expect(text).toContain("admin@example.test");
    expect(text).toContain("Usuario de prueba");
    expect(text).toContain("usuario@example.test");

    const rows = fixture.nativeElement.querySelectorAll(
      '[data-testid="user-row"]',
    );

    expect(rows.length).toBe(2);
  });

  it("muestra la persona vinculada", () => {
    component.users = [users[1]];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("María");
    expect(text).toContain("López");
    expect(text).toContain("Pérez");
  });

  it("identifica usuarios sin persona vinculada", () => {
    component.users = [users[0]];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Sin persona vinculada");
    expect(text).toContain("Administrador inicial");
  });

  it("muestra mensaje cuando no hay usuarios", () => {
    component.users = [];
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector(
      '[data-testid="users-empty"]',
    );

    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain("No hay usuarios para mostrar.");

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="user-row"]').length,
    ).toBe(0);
  });
  it("emite el usuario seleccionado al consultar sus roles", () => {
    component.users = users;

    const selected: UserSummary[] = [];

    component.userSelected.subscribe((user) => {
      selected.push(user);
    });

    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('[data-testid="view-user-roles"]');

    expect(buttons.length).toBe(2);

    buttons[1].click();

    expect(selected).toEqual([users[1]]);
    expect(selected[0].id).toBe(2);
    expect(selected[0].email).toBe("usuario@example.test");
  });

  it("convierte correctamente la fecha UTC al horario de Mexico", () => {
    component.users = [
      {
        ...users[1],
        created_at: "2026-10-28T02:00:00Z",
      },
    ];

    fixture.detectChanges();

    const row: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="user-row"]',
    );

    expect(row.textContent).toContain("2026-10-27");
  });

  it("respeta el cambio de dia en horario de Mexico", () => {
    expect(component.registrationDate("2026-10-28T06:30:00Z")).toBe(
      "2026-10-28",
    );
  });

  it("oculta las casillas cuando el modo masivo esta desactivado", () => {
    component.users = users;
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll(
      '[data-testid="bulk-user-checkbox"]',
    );

    expect(checkboxes.length).toBe(0);
  });

  it("solo permite seleccionar usuarios vinculados a Personas", () => {
    component.users = users;
    component.bulkSelectionEnabled = true;
    fixture.detectChanges();

    const checkboxes: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll(
        '[data-testid="bulk-user-checkbox"]',
      );

    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].disabled).toBe(true);
    expect(checkboxes[1].disabled).toBe(false);
  });

  it("emite seleccion y exclusion del usuario vinculado", () => {
    component.users = users;
    component.bulkSelectionEnabled = true;

    const changes: Array<{
      user: UserSummary;
      selected: boolean;
    }> = [];

    component.selectionChanged.subscribe((event) => {
      changes.push(event);
    });

    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelectorAll(
      '[data-testid="bulk-user-checkbox"]',
    )[1];

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));

    expect(changes).toEqual([
      { user: users[1], selected: true },
      { user: users[1], selected: false },
    ]);
  });

  it("oculta Administrar en modo masivo y conserva la seleccion", () => {
    component.users = users;
    component.bulkSelectionEnabled = true;
    component.selectedUserIds = [2];
    component.selectedUserId = 2;

    fixture.detectChanges();

    const checkboxes: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll(
        '[data-testid="bulk-user-checkbox"]',
      );

    expect(checkboxes[1].checked).toBe(true);

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="view-user-roles"]',
    );

    expect(buttons.length).toBe(0);

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll(
        "thead th",
      ) as NodeListOf<HTMLElement>,
    ).map((header) => header.textContent?.trim());

    expect(headers).not.toContain("Acciones");
    expect(checkboxes[1].checked).toBe(true);
  });
  it("muestra codigos de roles solo en asignacion masiva", () => {
    component.users = users.map((user, index) => ({
      ...user,
      roles:
        index === 0
          ? [
              {
                id: 3,
                code: "ROL_CONSULTA_PERSONAS",
                name: "Consulta de Personas",
              },
            ]
          : [],
    }));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain(
      "ROL_CONSULTA_PERSONAS",
    );

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="view-user-roles"]')
        .length,
    ).toBeGreaterThan(0);

    fixture.componentRef.setInput("bulkSelectionEnabled", true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "ROL_CONSULTA_PERSONAS",
    );

    expect(fixture.nativeElement.textContent).toContain("Sin roles asignados");

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="view-user-roles"]')
        .length,
    ).toBe(0);
  });
  it("busca usuarios ignorando acentos y mayusculas", () => {
    component.users = users;
    fixture.detectChanges();

    const search: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="users-global-search"]',
    );

    search.value = "MARIA LOPEZ";
    search.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    const rows: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('[data-testid="user-row"]');

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain("Usuario de prueba");
    expect(rows[0].textContent).not.toContain("Administrador inicial");
  });

  it("filtra la columna Usuario por correo", () => {
    component.users = users;
    fixture.detectChanges();

    const search: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="users-column-name"]',
    );

    search.value = "ADMIN@EXAMPLE.TEST";
    search.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    expect(component.filteredUsers().map((user) => user.id)).toEqual([1]);

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="user-row"]').length,
    ).toBe(1);
  });

  it("combina el filtro de Persona vinculada con la busqueda", () => {
    component.users = users;
    component.globalSearch = "usuario";
    component.personFilter = "linked";
    fixture.detectChanges();

    expect(component.filteredUsers().map((user) => user.id)).toEqual([2]);

    const personFilter: HTMLSelectElement = fixture.nativeElement.querySelector(
      '[data-testid="users-column-person"]',
    );

    personFilter.value = "unlinked";
    personFilter.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(component.filteredUsers()).toEqual([]);

    expect(
      fixture.nativeElement.querySelector('[data-testid="users-filter-empty"]'),
    ).not.toBeNull();
  });

  it("filtra la fecha de registro en horario de Mexico", () => {
    component.users = [
      {
        ...users[0],
        created_at: "2026-10-28T02:00:00Z",
      },
      {
        ...users[1],
        created_at: "2026-10-28T15:00:00Z",
      },
    ];

    component.registrationFilter = "2026-10-27";
    fixture.detectChanges();

    expect(component.filteredUsers().map((user) => user.id)).toEqual([1]);

    component.registrationFilter = "2026-10-28";
    fixture.detectChanges();

    expect(component.filteredUsers().map((user) => user.id)).toEqual([2]);
  });

  it("limpia todos los filtros y restaura la pagina", () => {
    component.users = users;
    component.globalSearch = "inexistente";
    component.userColumnSearch = "correo";
    component.personFilter = "linked";
    component.registrationFilter = "2026-01-01";
    fixture.detectChanges();

    expect(component.filteredUsers()).toEqual([]);

    const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="users-clear-filters"]',
    );

    clear.click();
    fixture.detectChanges();

    expect(component.globalSearch).toBe("");
    expect(component.userColumnSearch).toBe("");
    expect(component.personFilter).toBe("all");
    expect(component.registrationFilter).toBe("");
    expect(component.filteredUsers()).toEqual(users);

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="user-row"]').length,
    ).toBe(2);
  });
});
