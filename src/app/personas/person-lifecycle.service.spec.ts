import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { AuthService } from "../auth/auth.service";
import { PersonDetail } from "./person.models";
import { PersonService } from "./person.service";
import {
  PersonLifecycleError,
  PersonLifecycleService,
} from "./person-lifecycle.service";

describe("PersonLifecycleService", () => {
  let service: PersonLifecycleService;
  let events: string[];
  let reauthenticationError: unknown | null;
  let withdrawError: unknown | null;
  let reinstateError: unknown | null;

  const withdrawnPerson: PersonDetail = {
    id_persona: "0199b329-7600-7000-8000-000000000001",
    curp: null,
    rfc: null,
    num_expediente: "2026-00000001",
    nombres: "MARIA ELENA",
    apellido_paterno: "LOPEZ",
    apellido_materno: "GARCIA",
    fecha_nacimiento: "1990-01-01T00:00:00.000000Z",
    sexo: "FEMENINO",
    estado_civil: "SOLTERO",
    correo_institucional: null,
    correo_personal: null,
    id_pais_origen: null,
    id_pais_nacimiento: null,
    id_territorio_nacimiento: null,
    fecha_alta: "2026-10-12T12:00:00.000000Z",
    fecha_baja: "2026-10-14T20:00:00.000000Z",
    estatus: "BAJA",
  };

  const reinstatedPerson: PersonDetail = {
    ...withdrawnPerson,
    fecha_baja: null,
    estatus: "ACTIVO",
  };

  beforeEach(() => {
    events = [];
    reauthenticationError = null;
    withdrawError = null;
    reinstateError = null;

    const auth = {
      reauthenticate: (password: string) => {
        events.push("reauthenticate:" + password);

        if (reauthenticationError !== null) {
          return throwError(() => reauthenticationError);
        }

        return of(void 0);
      },
    };

    const persons = {
      withdraw: (idPersona: string) => {
        events.push("withdraw:" + idPersona);

        if (withdrawError !== null) {
          return throwError(() => withdrawError);
        }

        return of(withdrawnPerson);
      },

      reinstate: (idPersona: string) => {
        events.push("reinstate:" + idPersona);

        if (reinstateError !== null) {
          return throwError(() => reinstateError);
        }

        return of(reinstatedPerson);
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PersonLifecycleService,
        {
          provide: AuthService,
          useValue: auth,
        },
        {
          provide: PersonService,
          useValue: persons,
        },
      ],
    });

    service = TestBed.inject(PersonLifecycleService);
  });

  it("reautentica antes de dar de baja", () => {
    let result: PersonDetail | null = null;

    service
      .withdraw(withdrawnPerson.id_persona, "contraseña-de-prueba")
      .subscribe({
        next: (person) => {
          result = person;
        },
      });

    expect(events).toEqual([
      "reauthenticate:contraseña-de-prueba",
      "withdraw:" + withdrawnPerson.id_persona,
    ]);

    expect(result).toEqual(withdrawnPerson);
  });

  it("no ejecuta la baja cuando falla la reautenticacion", () => {
    const originalError = { status: 422 };
    reauthenticationError = originalError;

    let receivedError: unknown = null;

    service.withdraw(withdrawnPerson.id_persona, "incorrecta").subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    expect(events).toEqual(["reauthenticate:incorrecta"]);

    expect(receivedError).toBeInstanceOf(PersonLifecycleError);

    const lifecycleError = receivedError as PersonLifecycleError;

    expect(lifecycleError.stage).toBe("reauthentication");
    expect(lifecycleError.originalError).toBe(originalError);
  });

  it("distingue un fallo de la operacion de baja", () => {
    const originalError = { status: 423 };
    withdrawError = originalError;

    let receivedError: unknown = null;

    service.withdraw(withdrawnPerson.id_persona, "correcta").subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    expect(receivedError).toBeInstanceOf(PersonLifecycleError);

    const lifecycleError = receivedError as PersonLifecycleError;

    expect(lifecycleError.stage).toBe("operation");
    expect(lifecycleError.originalError).toBe(originalError);
  });

  it("reautentica antes de reingresar", () => {
    let result: PersonDetail | null = null;

    service
      .reinstate(reinstatedPerson.id_persona, "contraseña-de-prueba")
      .subscribe({
        next: (person) => {
          result = person;
        },
      });

    expect(events).toEqual([
      "reauthenticate:contraseña-de-prueba",
      "reinstate:" + reinstatedPerson.id_persona,
    ]);

    expect(result).toEqual(reinstatedPerson);
  });

  it("no ejecuta el reingreso cuando falla la reautenticacion", () => {
    const originalError = { status: 422 };
    reauthenticationError = originalError;

    let receivedError: unknown = null;

    service.reinstate(reinstatedPerson.id_persona, "incorrecta").subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    expect(events).toEqual(["reauthenticate:incorrecta"]);

    const lifecycleError = receivedError as PersonLifecycleError;

    expect(lifecycleError.stage).toBe("reauthentication");
    expect(lifecycleError.originalError).toBe(originalError);
  });

  it("distingue un fallo de la operacion de reingreso", () => {
    const originalError = { status: 500 };
    reinstateError = originalError;

    let receivedError: unknown = null;

    service.reinstate(reinstatedPerson.id_persona, "correcta").subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    const lifecycleError = receivedError as PersonLifecycleError;

    expect(lifecycleError.stage).toBe("operation");
    expect(lifecycleError.originalError).toBe(originalError);
  });
});
