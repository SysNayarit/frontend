import { ComponentFixture, TestBed } from "@angular/core/testing";

import { createPersonReauthenticationForm } from "../../forms/person-reauthentication-form";
import { PersonReauthenticationFieldComponent } from "./person-reauthentication-field.component";

describe("PersonReauthenticationFieldComponent", () => {
  let fixture: ComponentFixture<PersonReauthenticationFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonReauthenticationFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonReauthenticationFieldComponent);

    fixture.componentRef.setInput("form", createPersonReauthenticationForm());
  });

  it("usa los identificadores de baja", () => {
    fixture.componentRef.setInput("mode", "withdraw");
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="persona-withdraw-password"]'),
    ).not.toBeNull();
  });

  it("usa los identificadores de reingreso", () => {
    fixture.componentRef.setInput("mode", "reinstate");
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="persona-reinstate-password"]'),
    ).not.toBeNull();
  });

  it("mantiene el formulario recibido como fuente de contraseña", () => {
    const form = createPersonReauthenticationForm();

    form.controls.password.setValue("contraseña-temporal");

    fixture.componentRef.setInput("form", form);
    fixture.componentRef.setInput("mode", "withdraw");
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="persona-withdraw-password"]',
    ) as HTMLInputElement;

    expect(input.value).toBe("contraseña-temporal");
  });

  it("muestra el error de contraseña recibido", () => {
    fixture.componentRef.setInput("mode", "reinstate");
    fixture.componentRef.setInput(
      "passwordError",
      "La contraseña no es válida.",
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="persona-reinstate-password-error"]')
        ?.textContent,
    ).toContain("La contraseña no es válida.");
  });
});
