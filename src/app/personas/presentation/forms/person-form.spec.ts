import { PersonDetail } from "../../person.models";
import {
  PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE,
  createPersonForm,
  normalizePersonForm,
  personCreateRequest,
  personFormHasErrors,
  personFormValidationErrorsFromResponse,
  personFormValueFromDetail,
  personUpdateRequest,
  validatePersonForm,
} from "./person-form";

describe("person-form", () => {
  it("crea instancias independientes del formulario", () => {
    const first = createPersonForm();
    const second = createPersonForm();

    first.controls.nombres.setValue("ANA");

    expect(first.controls.nombres.value).toBe("ANA");
    expect(second.controls.nombres.value).toBe("");
  });

  it("normaliza espacios de todos los campos", () => {
    const form = createPersonForm();

    form.setValue({
      nombres: "  MARIA ELENA  ",
      apellido_paterno: " LOPEZ ",
      apellido_materno: "  ",
      fecha_nacimiento: " 1990-05-20 ",
      sexo: " FEMENINO ",
      estado_civil: " CASADO ",
    });

    expect(normalizePersonForm(form)).toEqual({
      nombres: "MARIA ELENA",
      apellido_paterno: "LOPEZ",
      apellido_materno: "",
      fecha_nacimiento: "1990-05-20",
      sexo: "FEMENINO",
      estado_civil: "CASADO",
    });
  });

  it("mapea una persona al valor editable del formulario", () => {
    const person = {
      nombres: "MARIA ELENA",
      apellido_paterno: null,
      apellido_materno: "GARCIA",
      fecha_nacimiento: "1990-05-20T00:00:00Z",
      sexo: null,
      estado_civil: "SOLTERO",
    } as PersonDetail;

    expect(personFormValueFromDetail(person)).toEqual({
      nombres: "MARIA ELENA",
      apellido_paterno: "",
      apellido_materno: "GARCIA",
      fecha_nacimiento: "1990-05-20",
      sexo: "",
      estado_civil: "SOLTERO",
    });
  });

  it("valida nombres apellidos y fecha futura para registro", () => {
    const errors = validatePersonForm(
      {
        nombres: "",
        apellido_paterno: "",
        apellido_materno: "",
        fecha_nacimiento: "2999-12-31",
        sexo: "",
        estado_civil: "",
      },
      "register",
      new Date("2026-10-16T12:00:00Z"),
    );

    expect(errors).toEqual({
      nombres: "Los nombres son obligatorios",
      apellidos: "Debe capturarse al menos un apellido",
      fechaNacimiento: "La fecha de nacimiento no puede ser futura",
    });

    expect(personFormHasErrors(errors)).toBe(true);
  });

  it("conserva el mensaje propio de edicion para apellidos", () => {
    const errors = validatePersonForm(
      {
        nombres: "ANA",
        apellido_paterno: "",
        apellido_materno: "",
        fecha_nacimiento: "",
        sexo: "",
        estado_civil: "",
      },
      "edit",
      new Date("2026-10-16T12:00:00Z"),
    );

    expect(errors.apellidos).toBe(
      "La Persona debe conservar al menos un apellido",
    );
  });

  it("usa America Mexico City para determinar la fecha actual", () => {
    expect(PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE).toBe("America/Mexico_City");

    const errors = validatePersonForm(
      {
        nombres: "ANA",
        apellido_paterno: "PEREZ",
        apellido_materno: "",
        fecha_nacimiento: "2026-10-17",
        sexo: "",
        estado_civil: "",
      },
      "register",
      new Date("2026-10-17T04:30:00Z"),
    );

    expect(errors.fechaNacimiento).toBe(
      "La fecha de nacimiento no puede ser futura",
    );
  });

  it("construye el request de registro omitiendo opcionales vacios", () => {
    expect(
      personCreateRequest({
        nombres: "ANA",
        apellido_paterno: "",
        apellido_materno: "PEREZ",
        fecha_nacimiento: "",
        sexo: "",
        estado_civil: "",
      }),
    ).toEqual({
      nombres: "ANA",
      apellido_paterno: null,
      apellido_materno: "PEREZ",
    });
  });

  it("construye el request de edicion usando null en opcionales vacios", () => {
    expect(
      personUpdateRequest({
        nombres: "ANA",
        apellido_paterno: "PEREZ",
        apellido_materno: "",
        fecha_nacimiento: "",
        sexo: "",
        estado_civil: "",
      }),
    ).toEqual({
      nombres: "ANA",
      apellido_paterno: "PEREZ",
      apellido_materno: null,
      fecha_nacimiento: null,
      sexo: null,
      estado_civil: null,
    });
  });

  it("mapea todos los errores 422 reconocidos del backend", () => {
    const errors = personFormValidationErrorsFromResponse({
      status: 422,
      error: {
        errors: {
          nombres: ["Nombre rechazado por el servidor."],
          apellido_paterno: ["Apellido paterno rechazado."],
          apellido_materno: ["Apellido materno rechazado."],
          fecha_nacimiento: ["Fecha rechazada por el servidor."],
        },
      },
    });

    expect(errors).toEqual({
      nombres: "Nombre rechazado por el servidor.",
      apellidos: "Apellido paterno rechazado.",
      fechaNacimiento: "Fecha rechazada por el servidor.",
    });
  });

  it("usa el error del apellido materno cuando no existe error paterno", () => {
    const errors = personFormValidationErrorsFromResponse({
      status: 422,
      error: {
        errors: {
          apellido_materno: ["Apellido materno rechazado."],
        },
      },
    });

    expect(errors).toEqual({
      nombres: null,
      apellidos: "Apellido materno rechazado.",
      fechaNacimiento: null,
    });
  });

  it("ignora respuestas que no son 422", () => {
    expect(
      personFormValidationErrorsFromResponse({
        status: 500,
        error: {
          errors: {
            nombres: ["No debe interpretarse."],
          },
        },
      }),
    ).toBeNull();
  });

  it("ignora errores 422 sin campos reconocidos de Persona", () => {
    expect(
      personFormValidationErrorsFromResponse({
        status: 422,
        error: {
          errors: {
            correo: ["Correo rechazado."],
          },
        },
      }),
    ).toBeNull();
  });
});
