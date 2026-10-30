import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { UserRole } from "../../../user-role.models";
import { createUserRoleReauthenticationForm } from "../../forms/user-role-reauthentication-form";
import { BulkRoleConfirmationComponent } from "./bulk-role-confirmation.component";

describe("BulkRoleConfirmationComponent", () => {
  let fixture: ComponentFixture<BulkRoleConfirmationComponent>;
  let component: BulkRoleConfirmationComponent;

  const role = {
    id: 2,
    code: "ROL_CONSULTA_PERSONAS",
    name: "Consulta de personas",
  } as UserRole;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkRoleConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkRoleConfirmationComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("role", role);
    fixture.componentRef.setInput("operation", "assign");
    fixture.componentRef.setInput("selectedCount", 3);
    fixture.componentRef.setInput("form", createUserRoleReauthenticationForm());

    fixture.detectChanges();
  });

  it("muestra el rol, la operacion y la cantidad seleccionada", () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("3 usuarios");
    expect(text).toContain("la asignación");
    expect(
      fixture.nativeElement.querySelector(
        "app-user-role-reauthentication-field",
      ),
    ).not.toBeNull();
  });

  it("requiere la contrasena administrativa", () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    component.confirmOperation();

    expect(confirm).not.toHaveBeenCalled();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="bulk-page-confirm-assignment"]',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it("emite confirmacion con formulario valido", () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    component.form.controls.password.setValue("contrasena-de-prueba");
    fixture.detectChanges();

    component.confirmOperation();

    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("identifica el boton de retirada y valida la contrasena", () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    fixture.componentRef.setInput("operation", "remove");
    fixture.detectChanges();

    const removalButton = fixture.nativeElement.querySelector(
      '[data-testid="bulk-page-confirm-removal"]',
    ) as HTMLButtonElement | null;

    expect(removalButton).not.toBeNull();
    expect(removalButton!.disabled).toBe(true);

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="bulk-page-confirm-assignment"]',
      ),
    ).toBeNull();

    component.form.controls.password.setValue("ClaveTemporalDePrueba");
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);
    expect(component.formInvalid()).toBe(false);

    const updatedButton = fixture.nativeElement.querySelector(
      '[data-testid="bulk-page-confirm-removal"]',
    ) as HTMLButtonElement | null;

    expect(updatedButton).not.toBeNull();
    expect(updatedButton!.disabled).toBe(false);

    updatedButton!.click();

    expect(confirm).toHaveBeenCalledTimes(1);
  });
  it("abre retirada como dialogo y permite cerrar con Escape", async () => {
    const cancel = vi.fn();
    component.cancel.subscribe(cancel);

    fixture.componentRef.setInput("operation", "remove");
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      '[data-dialog="bulk-removal-dialog"]',
    ) as HTMLElement | null;

    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute("role")).toBe("dialog");
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(dialog!.getAttribute("aria-label")).toBe(
      "Confirmar retirada de rol",
    );

    const password = dialog!.querySelector<HTMLInputElement>(
      '[data-testid="user-role-reauthentication-password"]',
    );

    expect(password).not.toBeNull();
    await Promise.resolve();

    expect(document.activeElement).toBe(password);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(cancel).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput("processing", true);
    fixture.detectChanges();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it("mantiene el foco dentro del dialogo con Tab", async () => {
    fixture.componentRef.setInput("operation", "remove");
    fixture.detectChanges();

    await Promise.resolve();

    const dialog = fixture.nativeElement.querySelector(
      '[data-dialog="bulk-removal-dialog"]',
    ) as HTMLElement;

    const password = dialog.querySelector<HTMLInputElement>(
      '[data-testid="user-role-reauthentication-password"]',
    )!;

    const cancel = dialog.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-page-cancel-confirmation"]',
    )!;

    expect(document.activeElement).toBe(password);

    cancel.focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(document.activeElement).toBe(password);

    password.focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(document.activeElement).toBe(cancel);
  });
  it("admite retirada sin ejecutar servicios", () => {
    fixture.componentRef.setInput("operation", "remove");
    component.form.controls.password.setValue("contrasena-de-prueba");
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("la retirada");
    expect(text).toContain("Confirmar retirada");
  });

  it("bloquea roles administrativos y cantidades fuera de rango", () => {
    const confirm = vi.fn();
    component.confirm.subscribe(confirm);

    component.form.controls.password.setValue("contrasena-de-prueba");

    component.role = {
      id: 1,
      code: "ROL_ADMIN_SISTEMA",
      name: "Administrador",
    } as UserRole;

    component.confirmOperation();
    expect(confirm).not.toHaveBeenCalled();

    component.role = role;
    component.selectedCount = 101;
    component.confirmOperation();

    component.selectedCount = 0;
    component.confirmOperation();

    expect(confirm).not.toHaveBeenCalled();
  });

  it("impide confirmar durante procesamiento y permite cancelar cuando termina", () => {
    const confirm = vi.fn();
    const cancel = vi.fn();

    component.confirm.subscribe(confirm);
    component.cancel.subscribe(cancel);
    component.form.controls.password.setValue("contrasena-de-prueba");
    fixture.componentRef.setInput("processing", true);

    component.confirmOperation();
    fixture.detectChanges();

    expect(confirm).not.toHaveBeenCalled();

    const cancelButton = fixture.nativeElement.querySelector(
      '[data-testid="bulk-page-cancel-confirmation"]',
    ) as HTMLButtonElement;

    expect(cancelButton.disabled).toBe(true);

    fixture.componentRef.setInput("processing", false);
    fixture.detectChanges();

    cancelButton.click();

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
