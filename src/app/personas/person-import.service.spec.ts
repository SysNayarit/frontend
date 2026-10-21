import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  PersonImportUploadResponse,
} from './person-import.models';
import { PersonImportService } from './person-import.service';

describe('PersonImportService', () => {
  let service: PersonImportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service =
      TestBed.inject(
        PersonImportService,
      );

    http =
      TestBed.inject(
        HttpTestingController,
      );
  });

  afterEach(() => {
    http.verify();
  });

  it('carga un XLSX de personas mediante multipart con la clave archivo', () => {
    const file =
      new File(
        [
          new Uint8Array([
            80,
            75,
            3,
            4,
          ]),
        ],
        'personas.xlsx',
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      );

    const backendResponse: PersonImportUploadResponse = {
      data: {
        uuid:
          '01900000-0000-7000-8000-000000000001',
        original_filename:
          'personas.xlsx',
        status: 'READY',
        total_rows: 3,
        valid_rows: 2,
        invalid_rows: 1,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
    };

    let result:
      PersonImportUploadResponse | undefined;

    service
      .upload(file)
      .subscribe((response) => {
        result = response;
      });

    const request =
      http.expectOne(
        '/api/personas/importaciones',
      );

    expect(
      request.request.method,
    ).toBe('POST');

    expect(
      request.request.body instanceof FormData,
    ).toBe(true);

    const body =
      request.request.body as FormData;

    expect(
      body.get('archivo'),
    ).toBe(file);

    expect(
      body.get('file'),
    ).toBeNull();

    request.flush(
      backendResponse,
      {
        status: 201,
        statusText: 'Created',
      },
    );

    expect(result).toEqual(
      backendResponse,
    );
  });

  it('no establece manualmente Content-Type al enviar FormData', () => {
    const file =
      new File(
        [
          'contenido-de-prueba',
        ],
        'personas.xlsx',
      );

    service
      .upload(file)
      .subscribe();

    const request =
      http.expectOne(
        '/api/personas/importaciones',
      );

    expect(
      request.request.headers.has(
        'Content-Type',
      ),
    ).toBe(false);

    request.flush({
      data: {
        uuid:
          '01900000-0000-7000-8000-000000000002',
        original_filename:
          'personas.xlsx',
        status: 'READY',
        total_rows: 1,
        valid_rows: 1,
        invalid_rows: 0,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
    });
  });
});
