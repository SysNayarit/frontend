import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  of,
  throwError,
} from 'rxjs';

import {
  AuthenticatedUser,
} from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';

import {
  PersonCreateRequest,
  PersonDetail,
  PersonListResponse,
  PersonUpdateRequest,
} from './person.models';
import { PersonService } from './person.service';
import {
  PersonasPageComponent,
} from './personas-page.component';

class AuthServiceStub {
  currentUserResult: AuthenticatedUser = {
    id: 1,
    id_persona: null,
    name: 'usuario.personas',
    email: 'usuario.personas@siga.test',
    email_verified_at: null,
    created_at: '2026-10-12T00:00:00.000000Z',
    updated_at: '2026-10-12T00:00:00.000000Z',
    person: null,
    permissions: [
      'personas.ver',
      'personas.crear',
    ],
  };

  currentUser() {
    return of(
      this.currentUserResult,
    );
  }
}
class PersonServiceStub {
  listCalls: number[] = [];

  findCalls: string[] = [];

  createCalls: PersonCreateRequest[] = [];

  updateCalls: Array<{
    idPersona: string;
    payload: PersonUpdateRequest;
  }> = [];

  updateShouldFail = false;

  updateValidationShouldFail = false;

  updateSurnameValidationShouldFail = false;

  updateBirthDateValidationShouldFail = false;

  createShouldFail = false;

  createValidationShouldFail = false;

  createSurnameValidationShouldFail = false;

  createBirthDateValidationShouldFail = false;

  findShouldFail = false;

  shouldFail = false;

  response: PersonListResponse = {
    data: [
      {
        id_persona:
          '0199b329-7600-7000-8000-000000000001',
        num_expediente: '2026-00000001',
        nombres: 'MARIA ELENA',
        apellido_paterno: 'LOPEZ',
        apellido_materno: 'GARCIA',
        estatus: 'ACTIVO',
      },
    ],
    meta: {
      current_page: 1,
      per_page: 20,
      last_page: 1,
      total: 1,
    },
  };

  detailResponse: PersonDetail = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    curp: null,
    rfc: null,
    num_expediente: '2026-00000001',
    nombres: 'MARIA ELENA',
    apellido_paterno: 'LOPEZ',
    apellido_materno: 'GARCIA',
    fecha_nacimiento: '1990-01-01',
    sexo: 'FEMENINO',
    estado_civil: 'SOLTERO',
    correo_institucional: null,
    correo_personal: null,
    id_pais_origen: null,
    id_pais_nacimiento: null,
    id_territorio_nacimiento: null,
    fecha_alta: '2026-10-12T12:00:00.000000Z',
    fecha_baja: null,
    estatus: 'ACTIVO',
  };

  create(
    payload: PersonCreateRequest,
  ) {
    this.createCalls.push(payload);

    if (this.createBirthDateValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              fecha_nacimiento: [
                'La fecha de nacimiento fue rechazada por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.createSurnameValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              apellido_paterno: [
                'El apellido paterno fue rechazado por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.createValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              nombres: [
                'El nombre fue rechazado por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.createShouldFail) {
      return throwError(
        () => new Error(
          'No fue posible registrar la persona.',
        ),
      );
    }

    return of(this.detailResponse);
  }

  update(
    idPersona: string,
    payload: PersonUpdateRequest,
  ) {
    this.updateCalls.push({
      idPersona,
      payload,
    });

    if (this.updateBirthDateValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              fecha_nacimiento: [
                'La fecha de nacimiento fue rechazada por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.updateSurnameValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              apellido_paterno: [
                'El apellido paterno fue rechazado por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.updateValidationShouldFail) {
      return throwError(
        () => ({
          status: 422,
          error: {
            message: 'The given data was invalid.',
            errors: {
              nombres: [
                'El nombre fue rechazado por el servidor.',
              ],
            },
          },
        }),
      );
    }

    if (this.updateShouldFail) {
      return throwError(
        () => new Error(
          'No fue posible actualizar la persona.',
        ),
      );
    }

    return of({
      ...this.detailResponse,
      ...payload,
    });
  }
  find(
    idPersona: string,
  ) {
    this.findCalls.push(idPersona);

    if (this.findShouldFail) {
      return throwError(
        () => new Error(
          'No fue posible obtener el detalle.',
        ),
      );
    }

    return of(this.detailResponse);
  }

  list(
    page = 1,
  ) {
    this.listCalls.push(page);

    if (this.shouldFail) {
      return throwError(
        () => new Error(
          'No fue posible obtener Personas.',
        ),
      );
    }

    return of(this.response);
  }
}

describe('PersonasPageComponent', () => {
  let service: PersonServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasPageComponent,
      ],
      providers: [
        {
          provide: PersonService,
          useClass: PersonServiceStub,
        },
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
      ],
    }).compileComponents();

    service = TestBed.inject(
      PersonService,
    ) as unknown as PersonServiceStub;
  });

  function createFixture(): ComponentFixture<PersonasPageComponent> {
    const fixture = TestBed.createComponent(
      PersonasPageComponent,
    );

    fixture.detectChanges();

    return fixture;
  }

  it('carga y muestra la primera pagina de personas', () => {
    const fixture = createFixture();

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.textContent,
    ).toContain('2026-00000001');

    expect(
      element.textContent,
    ).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(
      element.textContent,
    ).toContain('ACTIVO');
  });

  it('solicita la pagina siguiente cuando existe', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 1,
        per_page: 20,
        last_page: 2,
        total: 21,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const nextButton = element.querySelector(
      '[data-testid="personas-next-page"]',
    ) as HTMLButtonElement;

    expect(nextButton).not.toBeNull();

    nextButton.click();

    expect(
      service.listCalls,
    ).toEqual([
      1,
      2,
    ]);
  });

  it('solicita la pagina anterior cuando existe', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 2,
        per_page: 20,
        last_page: 2,
        total: 21,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const previousButton = element.querySelector(
      '[data-testid="personas-previous-page"]',
    ) as HTMLButtonElement;

    expect(previousButton).not.toBeNull();

    previousButton.click();

    expect(
      service.listCalls,
    ).toEqual([
      1,
      1,
    ]);
  });

  it('muestra un estado vacio cuando no existen personas', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 1,
        per_page: 20,
        last_page: 1,
        total: 0,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const emptyState = element.querySelector(
      '[data-testid="personas-empty-state"]',
    );

    expect(emptyState).not.toBeNull();

    expect(
      emptyState?.textContent,
    ).toContain(
      'No hay personas registradas',
    );
  });

  it('muestra un error cuando no puede cargar el listado', () => {
    service.shouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const errorState = element.querySelector(
      '[data-testid="personas-error-state"]',
    );

    expect(errorState).not.toBeNull();

    expect(
      errorState?.textContent,
    ).toContain(
      'No fue posible cargar el listado de personas',
    );

    expect(
      element.querySelector(
        '[data-testid="personas-empty-state"]',
      ),
    ).toBeNull();
  });

  it('consulta y muestra el detalle de la persona seleccionada', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const detailButton = element.querySelector(
      '[data-testid="persona-view-detail"]',
    ) as HTMLButtonElement | null;

    expect(detailButton).not.toBeNull();

    detailButton?.click();

    expect(
      service.findCalls,
    ).toEqual([
      '0199b329-7600-7000-8000-000000000001',
    ]);

    fixture.detectChanges();

    const detail = element.querySelector(
      '[data-testid="persona-detail"]',
    );

    expect(detail).not.toBeNull();

    expect(
      detail?.textContent,
    ).toContain('2026-00000001');

    expect(
      detail?.textContent,
    ).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(
      detail?.textContent,
    ).toContain('FEMENINO');

    expect(
      detail?.textContent,
    ).toContain('SOLTERO');
  });

  it('muestra un error cuando no puede consultar el detalle', () => {
    service.findShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const detailButton = element.querySelector(
      '[data-testid="persona-view-detail"]',
    ) as HTMLButtonElement;

    detailButton.click();

    fixture.detectChanges();

    expect(
      service.findCalls,
    ).toEqual([
      '0199b329-7600-7000-8000-000000000001',
    ]);

    const errorState = element.querySelector(
      '[data-testid="persona-detail-error"]',
    );

    expect(errorState).not.toBeNull();

    expect(
      errorState?.textContent,
    ).toContain(
      'No fue posible cargar el detalle de la persona',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-detail"]',
      ),
    ).toBeNull();
  });

  it('muestra la accion de registro cuando el usuario tiene personas.crear', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    );

    expect(registerButton).not.toBeNull();

    expect(
      registerButton?.textContent,
    ).toContain('Registrar persona');
  });

  it('oculta la accion de registro cuando el usuario no tiene personas.crear', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    );

    expect(registerButton).toBeNull();
  });

  it('muestra la accion de edicion cuando el usuario tiene personas.actualizar', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    );

    expect(editButton).not.toBeNull();

    expect(
      editButton?.textContent,
    ).toContain('Editar');
  });

  it('oculta la accion de edicion cuando el usuario no tiene personas.actualizar', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    );

    expect(editButton).toBeNull();
  });
  it('consulta la persona y abre el formulario de edicion precargado', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    expect(
      service.findCalls,
    ).toEqual([
      '0199b329-7600-7000-8000-000000000001',
    ]);

    const form = element.querySelector(
      '[data-testid="persona-edit-form"]',
    );

    expect(form).not.toBeNull();

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-nombres"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('MARIA ELENA');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-apellido-paterno"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('LOPEZ');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-apellido-materno"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('GARCIA');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-fecha-nacimiento"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('1990-01-01');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-sexo"]',
        ) as HTMLSelectElement
      ).value,
    ).toBe('FEMENINO');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-estado-civil"]',
        ) as HTMLSelectElement
      ).value,
    ).toBe('SOLTERO');
  });
  it('rechaza la edicion cuando faltan nombres y ambos apellidos', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-edit-apellido-paterno"]',
    ) as HTMLInputElement;

    const apellidoMaterno = element.querySelector(
      '[data-testid="persona-edit-apellido-materno"]',
    ) as HTMLInputElement;

    nombres.value = '';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = '';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    apellidoMaterno.value = '';
    apellidoMaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toEqual([]);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-nombres-error"]',
      )?.textContent,
    ).toContain(
      'Los nombres son obligatorios',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'La Persona debe conservar al menos un apellido',
    );
  });
  it('rechaza una fecha de nacimiento futura al editar', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-edit-fecha-nacimiento"]',
    ) as HTMLInputElement;

    fechaNacimiento.value = '2999-12-31';
    fechaNacimiento.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toEqual([]);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'La fecha de nacimiento no puede ser futura',
    );
  });
  it('cancela la edicion y cierra el formulario sin actualizar la persona', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    nombres.value = 'CAMBIO QUE NO DEBE GUARDARSE';
    nombres.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const cancelButton = element.querySelector(
      '[data-testid="persona-edit-cancel"]',
    ) as HTMLButtonElement | null;

    expect(cancelButton).not.toBeNull();

    cancelButton?.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).toBeNull();

    expect(
      service.updateCalls,
    ).toEqual([]);
  });
  it('actualiza la persona al enviar el formulario de edicion', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-edit-apellido-paterno"]',
    ) as HTMLInputElement;

    const apellidoMaterno = element.querySelector(
      '[data-testid="persona-edit-apellido-materno"]',
    ) as HTMLInputElement;

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-edit-fecha-nacimiento"]',
    ) as HTMLInputElement;

    const sexo = element.querySelector(
      '[data-testid="persona-edit-sexo"]',
    ) as HTMLSelectElement;

    const estadoCivil = element.querySelector(
      '[data-testid="persona-edit-estado-civil"]',
    ) as HTMLSelectElement;

    nombres.value = 'MARIA ELENA ACTUALIZADA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'LOPEZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    apellidoMaterno.value = '';
    apellidoMaterno.dispatchEvent(
      new Event('input'),
    );

    fechaNacimiento.value = '1991-02-03';
    fechaNacimiento.dispatchEvent(
      new Event('input'),
    );

    sexo.value = 'FEMENINO';
    sexo.dispatchEvent(
      new Event('change'),
    );

    estadoCivil.value = 'CASADO';
    estadoCivil.dispatchEvent(
      new Event('change'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement | null;

    expect(submitButton).not.toBeNull();

    submitButton?.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toEqual([
      {
        idPersona:
          '0199b329-7600-7000-8000-000000000001',
        payload: {
          nombres: 'MARIA ELENA ACTUALIZADA',
          apellido_paterno: 'LOPEZ',
          apellido_materno: null,
          fecha_nacimiento: '1991-02-03',
          sexo: 'FEMENINO',
          estado_civil: 'CASADO',
        },
      },
    ]);
  });
  it('muestra el error de fecha de nacimiento devuelto por el backend al editar', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    service.updateBirthDateValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'La fecha de nacimiento fue rechazada por el servidor.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-error"]',
      ),
    ).toBeNull();
  });
  it('muestra el error de apellido devuelto por el backend al editar', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    service.updateSurnameValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'El apellido paterno fue rechazado por el servidor.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-error"]',
      ),
    ).toBeNull();
  });
  it('muestra el error de nombres devuelto por el backend al editar', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    service.updateValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    nombres.value = 'MARIA ELENA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-nombres-error"]',
      )?.textContent,
    ).toContain(
      'El nombre fue rechazado por el servidor.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-error"]',
      ),
    ).toBeNull();
  });
  it('conserva la edicion y muestra un error cuando falla la actualizacion', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    service.updateShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    nombres.value = 'MARIA ELENA MODIFICADA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).not.toBeNull();

    expect(
      (
        element.querySelector(
          '[data-testid="persona-edit-nombres"]',
        ) as HTMLInputElement
      ).value,
    ).toBe(
      'MARIA ELENA MODIFICADA',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-error"]',
      )?.textContent,
    ).toContain(
      'No fue posible actualizar la persona',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-success"]',
      ),
    ).toBeNull();

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);
  });
  it('cierra la edicion confirma la actualizacion y recarga el listado', () => {
    const auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
        'personas.crear',
        'personas.actualizar',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const editButton = element.querySelector(
      '[data-testid="persona-edit"]',
    ) as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-edit-nombres"]',
    ) as HTMLInputElement;

    nombres.value = 'MARIA ELENA ACTUALIZADA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-edit-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.updateCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-edit-form"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-success"]',
      )?.textContent,
    ).toContain(
      'Persona actualizada correctamente',
    );

    expect(
      service.listCalls,
    ).toEqual([
      1,
      1,
    ]);
  });
  it('abre el formulario de registro al seleccionar Registrar persona', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).toBeNull();

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    expect(registerButton).not.toBeNull();

    registerButton.click();
    fixture.detectChanges();

    const form = element.querySelector(
      '[data-testid="persona-register-form"]',
    );

    expect(form).not.toBeNull();

    expect(
      form?.textContent,
    ).toContain('Registrar persona');
  });

  it('muestra los campos basicos para registrar una persona', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    );

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    );

    const apellidoMaterno = element.querySelector(
      '[data-testid="persona-apellido-materno"]',
    );

    expect(nombres).not.toBeNull();
    expect(apellidoPaterno).not.toBeNull();
    expect(apellidoMaterno).not.toBeNull();
  });

  it('rechaza el registro cuando faltan nombres y ambos apellidos', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement | null;

    expect(submitButton).not.toBeNull();

    submitButton?.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toEqual([]);

    expect(
      element.querySelector(
        '[data-testid="persona-nombres-error"]',
      )?.textContent,
    ).toContain(
      'Los nombres son obligatorios',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'Debe capturarse al menos un apellido',
    );
  });

  it('registra una persona con nombres y solo apellido materno', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoMaterno = element.querySelector(
      '[data-testid="persona-apellido-materno"]',
    ) as HTMLInputElement;

    nombres.value = 'ANA MARIA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoMaterno.value = 'PEREZ';
    apellidoMaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toEqual([
      {
        nombres: 'ANA MARIA',
        apellido_paterno: null,
        apellido_materno: 'PEREZ',
      },
    ]);

    expect(
      element.querySelector(
        '[data-testid="persona-nombres-error"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-apellidos-error"]',
      ),
    ).toBeNull();
  });

  it('muestra fecha de nacimiento sexo y estado civil en el registro', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-fecha-nacimiento"]',
    );

    const sexo = element.querySelector(
      '[data-testid="persona-sexo"]',
    );

    const estadoCivil = element.querySelector(
      '[data-testid="persona-estado-civil"]',
    );

    expect(fechaNacimiento).not.toBeNull();
    expect(sexo).not.toBeNull();
    expect(estadoCivil).not.toBeNull();
  });

  it('envia fecha de nacimiento sexo y estado civil al registrar', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-fecha-nacimiento"]',
    ) as HTMLInputElement;

    const sexo = element.querySelector(
      '[data-testid="persona-sexo"]',
    ) as HTMLSelectElement;

    const estadoCivil = element.querySelector(
      '[data-testid="persona-estado-civil"]',
    ) as HTMLSelectElement;

    nombres.value = 'JUAN CARLOS';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'LOPEZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fechaNacimiento.value = '1990-05-20';
    fechaNacimiento.dispatchEvent(
      new Event('input'),
    );

    sexo.value = 'MASCULINO';
    sexo.dispatchEvent(
      new Event('change'),
    );

    estadoCivil.value = 'CASADO';
    estadoCivil.dispatchEvent(
      new Event('change'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toEqual([
      {
        nombres: 'JUAN CARLOS',
        apellido_paterno: 'LOPEZ',
        apellido_materno: null,
        fecha_nacimiento: '1990-05-20',
        sexo: 'MASCULINO',
        estado_civil: 'CASADO',
      },
    ]);
  });

  it('cierra el formulario confirma el registro y recarga el listado', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    nombres.value = 'MARIA ELENA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'GARCIA';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-register-success"]',
      )?.textContent,
    ).toContain(
      'Persona registrada correctamente',
    );

    expect(
      service.listCalls,
    ).toEqual([
      1,
      1,
    ]);
  });

  it('conserva el formulario y muestra un error cuando falla el registro', () => {
    service.createShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    nombres.value = 'PEDRO';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'RAMIREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    const form = element.querySelector(
      '[data-testid="persona-register-form"]',
    );

    expect(form).not.toBeNull();

    expect(
      (
        element.querySelector(
          '[data-testid="persona-nombres"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('PEDRO');

    expect(
      (
        element.querySelector(
          '[data-testid="persona-apellido-paterno"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('RAMIREZ');

    expect(
      element.querySelector(
        '[data-testid="persona-register-error"]',
      )?.textContent,
    ).toContain(
      'No fue posible registrar la persona',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-register-success"]',
      ),
    ).toBeNull();

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);
  });

  it('rechaza una fecha de nacimiento futura', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-fecha-nacimiento"]',
    ) as HTMLInputElement;

    nombres.value = 'ANA';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'PEREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fechaNacimiento.value = '2999-12-31';
    fechaNacimiento.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toEqual([]);

    expect(
      element.querySelector(
        '[data-testid="persona-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'La fecha de nacimiento no puede ser futura',
    );
  });

  it('usa America/Mexico_City para validar la fecha de nacimiento', () => {
    const fixture = createFixture();

    const component =
      fixture.componentInstance;

    expect(
      component.birthDateValidationTimeZone,
    ).toBe(
      'America/Mexico_City',
    );
  });

  it('muestra el error de nombres devuelto por el backend', () => {
    service.createValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    nombres.value = 'JUAN';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'PEREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-nombres-error"]',
      )?.textContent,
    ).toContain(
      'El nombre fue rechazado por el servidor.',
    );

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);
  });

  it('muestra el error de apellido devuelto por el backend', () => {
    service.createSurnameValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    nombres.value = 'JUAN';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'PEREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'El apellido paterno fue rechazado por el servidor.',
    );

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);
  });

  it('muestra el error de fecha de nacimiento devuelto por el backend', () => {
    service.createBirthDateValidationShouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    const fechaNacimiento = element.querySelector(
      '[data-testid="persona-fecha-nacimiento"]',
    ) as HTMLInputElement;

    nombres.value = 'JUAN';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'PEREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fechaNacimiento.value = '1990-05-20';
    fechaNacimiento.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const submitButton = element.querySelector(
      '[data-testid="persona-register-submit"]',
    ) as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toHaveLength(1);

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'La fecha de nacimiento fue rechazada por el servidor.',
    );

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);
  });

  it('cancela el registro y cierra el formulario sin crear una persona', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).not.toBeNull();

    const cancelButton = element.querySelector(
      '[data-testid="persona-register-cancel"]',
    ) as HTMLButtonElement | null;

    expect(cancelButton).not.toBeNull();

    cancelButton?.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="persona-register-form"]',
      ),
    ).toBeNull();

    expect(service.createCalls).toEqual([]);
  });

  it('registra la persona al enviar el formulario', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const registerButton = element.querySelector(
      '[data-testid="persona-register"]',
    ) as HTMLButtonElement;

    registerButton.click();
    fixture.detectChanges();

    const nombres = element.querySelector(
      '[data-testid="persona-nombres"]',
    ) as HTMLInputElement;

    const apellidoPaterno = element.querySelector(
      '[data-testid="persona-apellido-paterno"]',
    ) as HTMLInputElement;

    nombres.value = 'JUAN';
    nombres.dispatchEvent(
      new Event('input'),
    );

    apellidoPaterno.value = 'PEREZ';
    apellidoPaterno.dispatchEvent(
      new Event('input'),
    );

    fixture.detectChanges();

    const form = element.querySelector(
      '[data-testid="persona-register-form"]',
    ) as HTMLFormElement;

    form.dispatchEvent(
      new Event(
        'submit',
        {
          bubbles: true,
          cancelable: true,
        },
      ),
    );

    fixture.detectChanges();

    expect(
      service.createCalls,
    ).toHaveLength(1);

    expect(
      service.createCalls[0],
    ).toEqual({
      nombres: 'JUAN',
      apellido_paterno: 'PEREZ',
      apellido_materno: null,
    });
  });
});
