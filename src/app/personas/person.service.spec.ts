import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  PersonDetail,
  PersonListResponse,
} from './person.models';
import { PersonService } from './person.service';

describe('PersonService', () => {
  let service: PersonService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PersonService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene la primera pagina del listado de personas', () => {
    const backendResponse: PersonListResponse = {
      data: [
        {
          id_persona:
            '0199b329-7600-7000-8000-000000000001',
          num_expediente: '2026-00000001',
          nombres: 'PERSONA DE PRUEBA',
          apellido_paterno: 'SIGA',
          apellido_materno: null,
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

    let result: PersonListResponse | undefined;

    service.list().subscribe((response) => {
      result = response;
    });

    const request = http.expectOne(
      '/api/personas?page=1',
    );

    expect(request.request.method).toBe('GET');

    request.flush(backendResponse);

    expect(result).toEqual(
      backendResponse,
    );
  });

  it('obtiene la pagina solicitada del listado de personas', () => {
    service.list(2).subscribe();

    const request = http.expectOne(
      '/api/personas?page=2',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      data: [],
      meta: {
        current_page: 2,
        per_page: 20,
        last_page: 2,
        total: 21,
      },
    });
  });

  it('obtiene una persona por id persona', () => {
    const idPersona =
      '0199b329-7600-7000-8000-000000000001';

    const backendResponse: PersonDetail = {
      id_persona: idPersona,
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

    let result: PersonDetail | undefined;

    service
      .find(idPersona)
      .subscribe((person) => {
        result = person;
      });

    const request = http.expectOne(
      `/api/personas/${idPersona}`,
    );

    expect(request.request.method).toBe('GET');

    request.flush(backendResponse);

    expect(result).toEqual(
      backendResponse,
    );
  });
});
