import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserRole } from "../../../user-role.models";
import { UserSummary } from "../../../user.models";
import {
  createUserRoleReauthenticationForm,
} from "../../forms/user-role-reauthentication-form";
import {
  UserRoleConfirmationComponent,
} from "./user-role-confirmation.component";

describe("UserRoleConfirmationComponent", () => {
  let fixture: ComponentFixture<UserRoleConfirmationComponent>;
  let component: UserRoleConfirmationComponent;

  const user: UserSummary = {
    id: 15,
    id_persona: null,
    name: "Usuario de prueba",
    email: "usuario@example.test",
    created_at: "2026-10-26T12:00:00Z",
    person: null,
  };

  const ordinaryRole: UserRole = {
    id: 3,
    code: "ROL_GESTOR_PERSONAS",
    name: "Gestor de Personas",
  };

  const adminRole: UserRole = {
    id: 1,
    code: "ROL_ADMIN_SISTEMA",
    name: "Administrador del Sistema",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      UserRoleConfirmationComponent,
    );

    component = fixture.componentInstance;
    component.user = user;
    component.role = ordinaryRole;
    component.operation = "assign";
    component.form = createUserRoleReauthenticationForm();
  });

  it("muestra el usuario, rol y operacion seleccionados", () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Asignar rol");
    expect(text).toContain("Usuario de prueba");
    expect(text).toContain("Gestor de Personas");

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    expect(button.textContent).toContain("Confirmar asignación");
  });

  it("requiere una contrasena antes de confirmar", () => {
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    expect(button.disabled).toBe(true);

    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });

  it("emite confirmacion para asignar un rol ordinario", () => {
    let confirmations = 0;

    component.confirm.subscribe(() => {
      confirmations++;
    });

    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    button.click();

    expect(confirmations).toBe(1);
  });

  it("muestra la operacion de retiro y permite confirmarla", () => {
    component.operation = "remove";
    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    let confirmations = 0;

    component.confirm.subscribe(() => {
      confirmations++;
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    expect(button.textContent).toContain("Confirmar retiro");

    button.click();

    expect(confirmations).toBe(1);
  });

  it("bloquea modificaciones del rol administrador protegido", () => {
    component.role = adminRole;
    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    let confirmations = 0;

    component.confirm.subscribe(() => {
      confirmations++;
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="protected-admin-role"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      ),
    ).toBeNull();

    component.confirmOperation();

    expect(confirmations).toBe(0);
  });

  it("impide confirmar mientras procesa otra solicitud", () => {
    component.processing = true;
    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    let confirmations = 0;

    component.confirm.subscribe(() => {
      confirmations++;
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-user-role-operation"]',
      );

    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Procesando");

    component.confirmOperation();

    expect(confirmations).toBe(0);
  });

  it("emite cancelacion cuando no hay procesamiento", () => {
    let cancellations = 0;

    component.cancel.subscribe(() => {
      cancellations++;
    });

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="cancel-user-role-operation"]',
      );

    button.click();

    expect(cancellations).toBe(1);
  });

  it("muestra errores de operacion y contrasena", () => {
    component.passwordError = "Contraseña incorrecta.";
    component.operationError = "No fue posible modificar el rol.";

    fixture.detectChanges();

    const passwordError: HTMLElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-password-error"]',
      );

    const operationError: HTMLElement =
      fixture.nativeElement.querySelector(
        '[data-testid="role-operation-error"]',
      );

    expect(passwordError.textContent)
      .toContain("Contraseña incorrecta.");

    expect(operationError.textContent)
      .toContain("No fue posible modificar el rol.");
  });
});