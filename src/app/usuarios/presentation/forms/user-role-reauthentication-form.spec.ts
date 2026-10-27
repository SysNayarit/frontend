import { createUserRoleReauthenticationForm } from "./user-role-reauthentication-form";

describe("createUserRoleReauthenticationForm", () => {
  it("inicializa la contrasena vacia", () => {
    const form = createUserRoleReauthenticationForm();

    expect(form.controls.password.value).toBe("");
    expect(form.invalid).toBe(true);
  });

  it("requiere introducir la contrasena", () => {
    const form = createUserRoleReauthenticationForm();

    form.controls.password.setValue("");

    expect(form.controls.password.hasError("required"))
      .toBe(true);

    form.controls.password.setValue("ClaveTemporalDePrueba");

    expect(form.valid).toBe(true);
  });

  it("solo incluye el campo password", () => {
    const form = createUserRoleReauthenticationForm();

    expect(Object.keys(form.controls)).toEqual(["password"]);
    expect(form.getRawValue()).toEqual({ password: "" });
  });

  it("permite limpiar la contrasena despues de usarla", () => {
    const form = createUserRoleReauthenticationForm();

    form.controls.password.setValue("ClaveTemporalDePrueba");

    expect(form.valid).toBe(true);

    form.reset();

    expect(form.controls.password.value).toBe("");
    expect(form.invalid).toBe(true);
  });
});