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
    expect(empty.textContent).toContain(
      "No hay usuarios para mostrar.",
    );

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="user-row"]',
      ).length,
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
      fixture.nativeElement.querySelectorAll(
        '[data-testid="view-user-roles"]',
      );

    expect(buttons.length).toBe(2);

    buttons[1].click();

    expect(selected).toEqual([users[1]]);
    expect(selected[0].id).toBe(2);
    expect(selected[0].email).toBe("usuario@example.test");
  });

  it("convierte correctamente la fecha UTC al horario de Mexico", () => {
    component.users = [{
      ...users[1],
      created_at: "2026-10-28T02:00:00Z",
    }];

    fixture.detectChanges();

    const row: HTMLElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-row"]',
      );

    expect(row.textContent).toContain("2026-10-27");
  });

  it("respeta el cambio de dia en horario de Mexico", () => {
    expect(
      component.registrationDate("2026-10-28T06:30:00Z"),
    ).toBe("2026-10-28");
  });
});