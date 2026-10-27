import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  createUserRoleReauthenticationForm,
} from "../../forms/user-role-reauthentication-form";

import {
  UserRoleReauthenticationFieldComponent,
} from "./user-role-reauthentication-field.component";

describe("UserRoleReauthenticationFieldComponent", () => {
  let fixture: ComponentFixture<UserRoleReauthenticationFieldComponent>;
  let component: UserRoleReauthenticationFieldComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleReauthenticationFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      UserRoleReauthenticationFieldComponent,
    );

    component = fixture.componentInstance;
    component.form = createUserRoleReauthenticationForm();
  });

  it("muestra el campo de contrasena", () => {
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-reauthentication-password"]',
      );

    expect(input).not.toBeNull();
    expect(input.type).toBe("password");
    expect(input.autocomplete).toBe("current-password");
  });

  it("vincula el campo con el formulario reactivo", () => {
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-reauthentication-password"]',
      );

    input.value = "ClaveTemporalDePrueba";
    input.dispatchEvent(new Event("input"));

    expect(component.form.controls.password.value)
      .toBe("ClaveTemporalDePrueba");
    expect(component.form.valid).toBe(true);
  });

  it("permite limpiar la contrasena del formulario", () => {
    component.form.controls.password.setValue(
      "ClaveTemporalDePrueba",
    );

    fixture.detectChanges();

    component.form.reset();
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-reauthentication-password"]',
      );

    expect(input.value).toBe("");
    expect(component.form.invalid).toBe(true);
  });

  it("muestra el error de reautenticacion", () => {
    component.passwordError = "La contraseña es incorrecta.";

    fixture.detectChanges();

    const error: HTMLElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-password-error"]',
      );

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-reauthentication-password"]',
      );

    expect(error).not.toBeNull();
    expect(error.textContent).toContain(
      "La contraseña es incorrecta.",
    );

    expect(error.getAttribute("role")).toBe("alert");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby"))
      .toBe("user-role-password-error");
  });

  it("no muestra errores cuando no existen", () => {
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '[data-testid="user-role-password-error"]',
    );

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '[data-testid="user-role-reauthentication-password"]',
      );

    expect(error).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });
});