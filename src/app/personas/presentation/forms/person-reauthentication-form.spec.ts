import { createPersonReauthenticationForm } from "./person-reauthentication-form";

describe("person-reauthentication-form", () => {
  it("crea el formulario con contraseña vacía", () => {
    const form = createPersonReauthenticationForm();

    expect(form.controls.password.value).toBe("");
  });

  it("crea instancias independientes", () => {
    const first = createPersonReauthenticationForm();
    const second = createPersonReauthenticationForm();

    first.controls.password.setValue("clave-temporal");

    expect(first.controls.password.value).toBe("clave-temporal");
    expect(second.controls.password.value).toBe("");
  });
});
