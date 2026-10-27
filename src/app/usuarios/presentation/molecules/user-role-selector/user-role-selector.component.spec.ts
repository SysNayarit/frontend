import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserRole } from "../../../user-role.models";
import { UserRoleSelectorComponent } from "./user-role-selector.component";

describe("UserRoleSelectorComponent", () => {
  let fixture: ComponentFixture<UserRoleSelectorComponent>;
  let component: UserRoleSelectorComponent;

  const ordinaryRole: UserRole = {
    id: 2,
    code: "ROL_GESTOR_PERSONAS",
    name: "Gestor de Personas",
  };

  const secondRole: UserRole = {
    id: 3,
    code: "ROL_CONSULTA_PERSONAS",
    name: "Consulta de Personas",
  };

  const adminRole: UserRole = {
    id: 1,
    code: "ROL_ADMIN_SISTEMA",
    name: "Administrador del Sistema",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserRoleSelectorComponent);
    component = fixture.componentInstance;
  });

  it("muestra los roles ordinarios disponibles", () => {
    component.roles = [ordinaryRole, secondRole];

    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="select-available-role"]',
    );

    expect(buttons.length).toBe(2);

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Gestor de Personas");
    expect(text).toContain("Consulta de Personas");
  });

  it("excluye los roles que ya estan asignados", () => {
    component.roles = [ordinaryRole, secondRole];
    component.assignedRoles = [ordinaryRole];

    fixture.detectChanges();

    expect(component.availableRoles).toEqual([secondRole]);

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="select-available-role"]',
    );

    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain(
      "Consulta de Personas",
    );
  });

  it("excluye siempre el rol administrador protegido", () => {
    component.roles = [adminRole, ordinaryRole];

    fixture.detectChanges();

    expect(component.availableRoles).toEqual([ordinaryRole]);

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="select-available-role"]',
    );

    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).not.toContain(
      "Administrador del Sistema",
    );
  });

  it("emite el rol ordinario seleccionado", () => {
    component.roles = [ordinaryRole, secondRole];

    const selected: UserRole[] = [];

    component.roleSelected.subscribe((role) => {
      selected.push(role);
    });

    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll(
        '[data-testid="select-available-role"]',
      );

    buttons[1].click();

    expect(selected).toEqual([secondRole]);
  });

  it("muestra mensaje cuando no quedan roles disponibles", () => {
    component.roles = [adminRole, ordinaryRole];
    component.assignedRoles = [ordinaryRole];

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-available-roles"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="select-available-role"]',
      ).length,
    ).toBe(0);
  });

  it("muestra estado de carga sin ofrecer seleccion", () => {
    component.roles = [ordinaryRole];
    component.loading = true;

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="status"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="select-available-role"]',
      ),
    ).toBeNull();
  });

  it("muestra errores y permite reintentar", () => {
    component.error = "No fue posible consultar el catálogo.";

    let retries = 0;

    component.retry.subscribe(() => {
      retries++;
    });

    fixture.detectChanges();

    const alert: HTMLElement =
      fixture.nativeElement.querySelector('[role="alert"]');

    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain(
      "No fue posible consultar el catálogo.",
    );

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="retry-role-catalog"]',
      );

    button.click();

    expect(retries).toBe(1);
  });

  it("emite cancelacion del selector", () => {
    let cancellations = 0;

    component.cancel.subscribe(() => {
      cancellations++;
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="cancel-role-selection"]',
      );

    button.click();

    expect(cancellations).toBe(1);
  });
});