import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  UserCreateFormComponent,
  UserCreateFormValue,
} from "./user-create-form.component";

describe("UserCreateFormComponent", () => {
  let fixture: ComponentFixture<UserCreateFormComponent>;
  let component: UserCreateFormComponent;

  const person = {
    id_persona: "00000000-0000-4000-8000-000000000001",
    num_expediente: "123",
    nombres: "MARIA",
    apellido_paterno: "PRUEBA",
    apellido_materno: null,
    estatus: "ACTIVO",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreateFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("person", person);
    fixture.detectChanges();
  });

  it("muestra la Persona seleccionada", () => {
    expect(fixture.nativeElement.textContent)
      .toContain("MARIA");
    expect(fixture.nativeElement.textContent)
      .toContain("123");
  });

  it("rechaza contrasenas cortas", () => {
    component.form.patchValue({
      email: "usuario@example.test",
      password: "Corta123",
      password_confirmation: "Corta123",
      administratorPassword: "ClaveActual",
    });

    expect(component.canSubmit()).toBe(false);
  });

  it("rechaza contrasenas diferentes", () => {
    component.form.patchValue({
      email: "usuario@example.test",
      password: "ClaveInicialSegura2026",
      password_confirmation: "OtraClaveSegura2026",
      administratorPassword: "ClaveActual",
    });

    expect(component.canSubmit()).toBe(false);
  });

  it("emite credenciales validas para confirmar", () => {
    let result: UserCreateFormValue | undefined;

    component.confirm.subscribe((value) => {
      result = value;
    });

    component.form.patchValue({
      email: "usuario@example.test",
      password: "ClaveInicialSegura2026",
      password_confirmation: "ClaveInicialSegura2026",
      administratorPassword: "ClaveActual",
    });

    component.submit();

    expect(result?.email).toBe("usuario@example.test");
    expect(result?.administratorPassword).toBe("ClaveActual");
  });

  it("permite cancelar", () => {
    let cancelled = false;
    component.cancel.subscribe(() => cancelled = true);

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );

    buttons.find((button) => button.textContent?.includes("Cancelar"))
      ?.click();

    expect(cancelled).toBe(true);
  });

  it("bloquea el formulario durante la creacion", () => {
    component.form.patchValue({
      email: "usuario@example.test",
      password: "ClaveInicialSegura2026",
      password_confirmation: "ClaveInicialSegura2026",
      administratorPassword: "ClaveAdministrador",
    });

    let confirmations = 0;
    component.confirm.subscribe(() => confirmations++);

    fixture.componentRef.setInput("processing", true);
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="confirm-create-user"]',
      );

    const fieldset: HTMLFieldSetElement =
      fixture.nativeElement.querySelector("fieldset");

    expect(button.disabled).toBe(true);
    expect(fieldset.disabled).toBe(true);

    component.submit();
    expect(confirmations).toBe(0);
  });

  it("limpia las contrasenas al restablecer el formulario", () => {
    component.form.patchValue({
      email: "usuario@example.test",
      password: "ClaveInicialSegura2026",
      password_confirmation: "ClaveInicialSegura2026",
      administratorPassword: "ClaveAdministrador",
    });

    component.form.patchValue({
      password: "",
      password_confirmation: "",
      administratorPassword: "",
    });

    const value = component.form.getRawValue();

    expect(value.password).toBe("");
    expect(value.password_confirmation).toBe("");
    expect(value.administratorPassword).toBe("");
    expect(value.email).toBe("usuario@example.test");
    expect(component.canSubmit()).toBe(false);
  });

  it("no emite credenciales cuando el formulario es invalido", () => {
    let confirmations = 0;
    component.confirm.subscribe(() => confirmations++);

    component.form.patchValue({
      email: "correo-invalido",
      password: "ClaveInicialSegura2026",
      password_confirmation: "ClaveInicialSegura2026",
      administratorPassword: "ClaveAdministrador",
    });

    component.submit();

    expect(confirmations).toBe(0);
  });
});