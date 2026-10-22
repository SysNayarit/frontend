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

  it('consulta el preview de un lote mediante su UUID', () => {
    const batchUuid =
      '01900000-0000-7000-8000-000000000001';

    let result: unknown;

    service.getBatch(batchUuid).subscribe((response) => {
      result = response;
    });

    const request = http.expectOne(
      `/api/personas/importaciones/${batchUuid}?page=1`,
    );

    expect(request.request.method).toBe('GET');

    const response = {
      data: {
        uuid: batchUuid,
        original_filename: 'personas.xlsx',
        status: 'READY',
        total_rows: 2,
        valid_rows: 1,
        invalid_rows: 1,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
      rows: [
        {
          row_number: 2,
          status: 'VALID',
          raw_data: {
            nombres: 'MARIA',
          },
          normalized_data: {
            nombres: 'MARIA',
          },
          validation_errors: {},
          result_data: null,
        },
        {
          row_number: 3,
          status: 'INVALID',
          raw_data: {
            nombres: '',
          },
          normalized_data: {
            nombres: '',
          },
          validation_errors: {
            nombres: ['El nombre es obligatorio.'],
          },
          result_data: null,
        },
      ],
      meta: {
        current_page: 1,
        per_page: 50,
        last_page: 1,
        total: 2,
      },
    };

    request.flush(response);

    expect(result).toEqual(response);
  });

  it('permite consultar una pagina especifica del preview', () => {
    const batchUuid =
      '01900000-0000-7000-8000-000000000002';

    service.getBatch(batchUuid, 2).subscribe();

    const request = http.expectOne(
      `/api/personas/importaciones/${batchUuid}?page=2`,
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      data: {
        uuid: batchUuid,
        original_filename: 'personas.xlsx',
        status: 'READY',
        total_rows: 55,
        valid_rows: 54,
        invalid_rows: 1,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
      rows: [],
      meta: {
        current_page: 2,
        per_page: 50,
        last_page: 2,
        total: 55,
      },
    });
  });

  it('propaga errores HTTP durante la consulta del preview', () => {
    const batchUuid =
      '01900000-0000-7000-8000-000000000003';

    let errorStatus: number | undefined;

    service.getBatch(batchUuid).subscribe({
      error: (error: { status: number }) => {
        errorStatus = error.status;
      },
    });

    const request = http.expectOne(
      `/api/personas/importaciones/${batchUuid}?page=1`,
    );

    request.flush(
      { message: 'No autorizado.' },
      {
        status: 403,
        statusText: 'Forbidden',
      },
    );

    expect(errorStatus).toBe(403);
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
  it('confirma un lote READY mediante su UUID', () => {
    const batchUuid = '01900000-0000-7000-8000-000000000098';

    const response: PersonImportUploadResponse = {
      data: {
        uuid: batchUuid,
        original_filename: 'personas.xlsx',
        status: 'QUEUED',
        total_rows: 10,
        valid_rows: 10,
        invalid_rows: 0,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: '2026-10-22T12:00:00.000Z',
        started_at: null,
        finished_at: null,
      },
    };

    let result: PersonImportUploadResponse | undefined;

    service.confirmBatch(batchUuid).subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(
      `/api/personas/importaciones/${batchUuid}/confirmar`,
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush(response, {
      status: 202,
      statusText: 'Accepted',
    });

    expect(result).toEqual(response);
  });

  it('propaga errores HTTP durante la confirmación', () => {
    const batchUuid = '01900000-0000-7000-8000-000000000099';

    let errorStatus: number | undefined;

    service.confirmBatch(batchUuid).subscribe({
      error: (error: { status: number }) => {
        errorStatus = error.status;
      },
    });

    const request = http.expectOne(
      `/api/personas/importaciones/${batchUuid}/confirmar`,
    );

    expect(request.request.method).toBe('POST');

    request.flush(
      { message: 'Se requiere una reautenticación reciente.' },
      {
        status: 403,
        statusText: 'Forbidden',
      },
    );

    expect(errorStatus).toBe(403);
  });
});
