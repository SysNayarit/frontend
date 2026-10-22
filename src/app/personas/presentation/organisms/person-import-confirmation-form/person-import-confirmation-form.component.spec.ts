import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PersonImportBatch } from "../../../person-import.models";
import { createPersonReauthenticationForm } from "../../forms/person-reauthentication-form";
import { PersonImportConfirmationFormComponent } from "./person-import-confirmation-form.component";

describe("PersonImportConfirmationFormComponent", () => {
  let fixture: ComponentFixture<PersonImportConfirmationFormComponent>;

  const readyBatch: PersonImportBatch = {
    uuid: "01900000-0000-7000-8000-000000000098",
    original_filename: "personas.xlsx",
    status: "READY",
    total_rows: 10,
    valid_rows: 9,
    invalid_rows: 1,
    processed_rows: 0,
    failed_rows: 0,
    confirmed_at: null,
    started_at: null,
    finished_at: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonImportConfirmationFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonImportConfirmationFormComponent,
    );

    fixture.componentRef.setInput(
      "form",
      createPersonReauthenticationForm(),
    );
    fixture.componentRef.setInput("batch", readyBatch);
    fixture.componentRef.setInput("busy", false);
  });

  it("muestra el archivo y el resumen del lote", () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("personas.xlsx");
    expect(element.textContent).toContain("9");
    expect(element.textContent).toContain("1");
  });

  it("reutiliza el campo de contraseña para importación", () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="persona-import-password"]'),
    ).not.toBeNull();
  });

  it("emite la solicitud de confirmación al enviar el formulario", () => {
    const requests: number[] = [];

    fixture.componentInstance.submitRequested.subscribe(() => {
      requests.push(1);
    });

    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector(
      '[data-testid="person-import-confirmation-form"]',
    ) as HTMLFormElement;

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(requests).toHaveLength(1);
  });

  it("bloquea la confirmación mientras existe una operación en curso", () => {
    fixture.componentRef.setInput("busy", true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="person-import-confirm-submit"]',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it("impide confirmar lotes que no están listos o no tienen filas válidas", () => {
    fixture.componentRef.setInput("batch", {
      ...readyBatch,
      status: "QUEUED",
    });

    fixture.detectChanges();

    let button = fixture.nativeElement.querySelector(
      '[data-testid="person-import-confirm-submit"]',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);

    fixture.componentRef.setInput("batch", {
      ...readyBatch,
      valid_rows: 0,
    });

    fixture.detectChanges();

    button = fixture.nativeElement.querySelector(
      '[data-testid="person-import-confirm-submit"]',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it("no emite confirmaciones mediante envíos manuales cuando está bloqueado", () => {
    const requests: number[] = [];

    fixture.componentInstance.submitRequested.subscribe(() => {
      requests.push(1);
    });

    fixture.componentRef.setInput("busy", true);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector(
      '[data-testid="person-import-confirmation-form"]',
    ) as HTMLFormElement;

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(requests).toHaveLength(0);

    fixture.componentRef.setInput("busy", false);
    fixture.componentRef.setInput("batch", {
      ...readyBatch,
      status: "QUEUED",
    });
    fixture.detectChanges();

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(requests).toHaveLength(0);
  });

  it("emite cancelación y muestra los mensajes de error", () => {
    const cancellations: number[] = [];

    fixture.componentInstance.cancelRequested.subscribe(() => {
      cancellations.push(1);
    });

    fixture.componentRef.setInput(
      "passwordError",
      "La contraseña es incorrecta.",
    );
    fixture.componentRef.setInput(
      "errorMessage",
      "No fue posible confirmar el lote.",
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="persona-import-password-error"]')
        ?.textContent,
    ).toContain("La contraseña es incorrecta.");

    expect(
      element.querySelector('[data-testid="person-import-confirmation-error"]')
        ?.textContent,
    ).toContain("No fue posible confirmar el lote.");

    const cancel = element.querySelector(
      '[data-testid="person-import-confirm-cancel"]',
    ) as HTMLButtonElement;

    cancel.click();

    expect(cancellations).toHaveLength(1);
  });
});
