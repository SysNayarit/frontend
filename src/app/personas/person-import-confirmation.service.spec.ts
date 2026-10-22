import { TestBed } from "@angular/core/testing";
import { Observable, of, throwError } from "rxjs";

import { AuthService } from "../auth/auth.service";
import { PersonImportUploadResponse } from "./person-import.models";
import { PersonImportService } from "./person-import.service";
import {
  PersonImportConfirmationError,
  PersonImportConfirmationService,
} from "./person-import-confirmation.service";

describe("PersonImportConfirmationService", () => {
  let service: PersonImportConfirmationService;

  let reauthenticateCalls: string[];
  let confirmCalls: string[];
  let events: string[];

  let reauthenticationError: unknown | null;
  let confirmationError: unknown | null;

  const batchUuid =
    "01900000-0000-7000-8000-000000001098";

  const queuedResponse: PersonImportUploadResponse = {
    data: {
      uuid: batchUuid,
      original_filename: "personas.xlsx",
      status: "QUEUED",
      total_rows: 10,
      valid_rows: 10,
      invalid_rows: 0,
      processed_rows: 0,
      failed_rows: 0,
      confirmed_at: "2026-10-22T12:00:00.000Z",
      started_at: null,
      finished_at: null,
    },
  };

  beforeEach(() => {
    reauthenticateCalls = [];
    confirmCalls = [];
    events = [];

    reauthenticationError = null;
    confirmationError = null;

    TestBed.configureTestingModule({
      providers: [
        PersonImportConfirmationService,
        {
          provide: AuthService,
          useValue: {
            reauthenticate: (password: string): Observable<void> => {
              reauthenticateCalls.push(password);
              events.push("reauthenticate");

              if (reauthenticationError !== null) {
                return throwError(() => reauthenticationError);
              }

              return of(void 0);
            },
          },
        },
        {
          provide: PersonImportService,
          useValue: {
            confirmBatch: (
              uuid: string,
            ): Observable<PersonImportUploadResponse> => {
              confirmCalls.push(uuid);
              events.push("confirm");

              if (confirmationError !== null) {
                return throwError(() => confirmationError);
              }

              return of(queuedResponse);
            },
          },
        },
      ],
    });

    service = TestBed.inject(PersonImportConfirmationService);
  });

  it("reautentica antes de confirmar el lote", () => {
    let result: PersonImportUploadResponse | undefined;

    service.confirm(batchUuid, "clave-de-prueba").subscribe((response) => {
      result = response;
    });

    expect(events).toEqual([
      "reauthenticate",
      "confirm",
    ]);

    expect(reauthenticateCalls).toEqual(["clave-de-prueba"]);
    expect(confirmCalls).toEqual([batchUuid]);
    expect(result).toEqual(queuedResponse);
  });

  it("no confirma cuando falla la reautenticación", () => {
    const originalError = new Error("Contraseña incorrecta");
    reauthenticationError = originalError;

    let receivedError: unknown;

    service.confirm(batchUuid, "incorrecta").subscribe({
      error: (error: unknown) => {
        receivedError = error;
      },
    });

    expect(events).toEqual(["reauthenticate"]);
    expect(confirmCalls).toEqual([]);

    expect(receivedError).toBeInstanceOf(PersonImportConfirmationError);

    const error = receivedError as PersonImportConfirmationError;

    expect(error.stage).toBe("reauthentication");
    expect(error.originalError).toBe(originalError);
  });

  it("distingue errores de confirmación del backend", () => {
    const originalError = new Error("Conflicto de lote");
    confirmationError = originalError;

    let receivedError: unknown;

    service.confirm(batchUuid, "clave-de-prueba").subscribe({
      error: (error: unknown) => {
        receivedError = error;
      },
    });

    expect(events).toEqual([
      "reauthenticate",
      "confirm",
    ]);

    expect(receivedError).toBeInstanceOf(PersonImportConfirmationError);

    const error = receivedError as PersonImportConfirmationError;

    expect(error.stage).toBe("confirmation");
    expect(error.originalError).toBe(originalError);
  });

  it("conserva QUEUED sin interpretarlo como importación completada", () => {
    let result: PersonImportUploadResponse | undefined;

    service.confirm(batchUuid, "clave-de-prueba").subscribe((response) => {
      result = response;
    });

    expect(result?.data.status).toBe("QUEUED");
    expect(result?.data.processed_rows).toBe(0);
  });
});
