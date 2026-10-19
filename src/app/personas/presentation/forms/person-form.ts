import { FormControl, FormGroup } from "@angular/forms";

import {
  PersonCreateRequest,
  PersonDetail,
  PersonUpdateRequest,
} from "../../person.models";
import { personDateInputValue } from "../utils/person-date";

export const PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE = "America/Mexico_City";

export type PersonForm = FormGroup<{
  nombres: FormControl<string>;
  apellido_paterno: FormControl<string>;
  apellido_materno: FormControl<string>;
  fecha_nacimiento: FormControl<string>;
  sexo: FormControl<string>;
  estado_civil: FormControl<string>;
}>;

export interface PersonFormValue {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  sexo: string;
  estado_civil: string;
}

export interface PersonFormValidationErrors {
  nombres: string | null;
  apellidos: string | null;
  fechaNacimiento: string | null;
}

export type PersonFormMode = "register" | "edit";

export function createPersonForm(): PersonForm {
  return new FormGroup({
    nombres: new FormControl("", {
      nonNullable: true,
    }),
    apellido_paterno: new FormControl("", {
      nonNullable: true,
    }),
    apellido_materno: new FormControl("", {
      nonNullable: true,
    }),
    fecha_nacimiento: new FormControl("", {
      nonNullable: true,
    }),
    sexo: new FormControl("", {
      nonNullable: true,
    }),
    estado_civil: new FormControl("", {
      nonNullable: true,
    }),
  });
}

export function normalizePersonForm(form: PersonForm): PersonFormValue {
  const values = form.getRawValue();

  return {
    nombres: values.nombres.trim(),
    apellido_paterno: values.apellido_paterno.trim(),
    apellido_materno: values.apellido_materno.trim(),
    fecha_nacimiento: values.fecha_nacimiento.trim(),
    sexo: values.sexo.trim(),
    estado_civil: values.estado_civil.trim(),
  };
}

export function personFormValueFromDetail(
  person: PersonDetail,
): PersonFormValue {
  return {
    nombres: person.nombres,
    apellido_paterno: person.apellido_paterno ?? "",
    apellido_materno: person.apellido_materno ?? "",
    fecha_nacimiento: personDateInputValue(person.fecha_nacimiento),
    sexo: person.sexo ?? "",
    estado_civil: person.estado_civil ?? "",
  };
}

export function validatePersonForm(
  values: PersonFormValue,
  mode: PersonFormMode,
  now = new Date(),
): PersonFormValidationErrors {
  const currentDate = currentDateInValidationTimeZone(now);

  const futureBirthDate =
    values.fecha_nacimiento !== "" && values.fecha_nacimiento > currentDate;

  return {
    nombres: values.nombres === "" ? "Los nombres son obligatorios" : null,
    apellidos:
      values.apellido_paterno === "" && values.apellido_materno === ""
        ? mode === "edit"
          ? "La Persona debe conservar al menos un apellido"
          : "Debe capturarse al menos un apellido"
        : null,
    fechaNacimiento: futureBirthDate
      ? "La fecha de nacimiento no puede ser futura"
      : null,
  };
}

export function personFormHasErrors(
  errors: PersonFormValidationErrors,
): boolean {
  return (
    errors.nombres !== null ||
    errors.apellidos !== null ||
    errors.fechaNacimiento !== null
  );
}

export function personFormValidationErrorsFromResponse(
  error: unknown,
): PersonFormValidationErrors | null {
  const response = error as {
    status?: number;
    error?: {
      errors?: Record<string, string[]>;
    };
  };

  if (response.status !== 422) {
    return null;
  }

  const errors = response.error?.errors;

  if (errors === undefined) {
    return null;
  }

  const validationErrors: PersonFormValidationErrors = {
    nombres: firstServerValidationMessage(
      errors["nombres"],
      "Los nombres no son válidos.",
    ),
    apellidos:
      firstServerValidationMessage(
        errors["apellido_paterno"],
        "Los apellidos no son válidos.",
      ) ??
      firstServerValidationMessage(
        errors["apellido_materno"],
        "Los apellidos no son válidos.",
      ),
    fechaNacimiento: firstServerValidationMessage(
      errors["fecha_nacimiento"],
      "La fecha de nacimiento no es válida.",
    ),
  };

  return personFormHasErrors(validationErrors)
    ? validationErrors
    : null;
}

function firstServerValidationMessage(
  messages: string[] | undefined,
  fallback: string,
): string | null {
  if (!messages?.length) {
    return null;
  }

  return messages[0] ?? fallback;
}

export function personCreateRequest(
  values: PersonFormValue,
): PersonCreateRequest {
  return {
    nombres: values.nombres,
    apellido_paterno:
      values.apellido_paterno === "" ? null : values.apellido_paterno,
    apellido_materno:
      values.apellido_materno === "" ? null : values.apellido_materno,
    ...(values.fecha_nacimiento !== ""
      ? { fecha_nacimiento: values.fecha_nacimiento }
      : {}),
    ...(values.sexo !== "" ? { sexo: values.sexo } : {}),
    ...(values.estado_civil !== ""
      ? { estado_civil: values.estado_civil }
      : {}),
  };
}

export function personUpdateRequest(
  values: PersonFormValue,
): PersonUpdateRequest {
  return {
    nombres: values.nombres,
    apellido_paterno:
      values.apellido_paterno === "" ? null : values.apellido_paterno,
    apellido_materno:
      values.apellido_materno === "" ? null : values.apellido_materno,
    fecha_nacimiento:
      values.fecha_nacimiento === "" ? null : values.fecha_nacimiento,
    sexo: values.sexo === "" ? null : values.sexo,
    estado_civil: values.estado_civil === "" ? null : values.estado_civil,
  };
}

function currentDateInValidationTimeZone(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: "year" | "month" | "day"): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return [value("year"), value("month"), value("day")].join("-");
}
