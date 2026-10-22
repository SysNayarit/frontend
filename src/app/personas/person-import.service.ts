import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PersonImportHistoryResponse,
  PersonImportPreviewResponse,
  PersonImportUploadResponse,
} from './person-import.models';

@Injectable({
  providedIn: 'root',
})
export class PersonImportService {
  private readonly http = inject(HttpClient);

  getHistory(page = 1): Observable<PersonImportHistoryResponse> {
    return this.http.get<PersonImportHistoryResponse>(
      '/api/personas/importaciones',
      {
        params: {
          page: String(page),
        },
      },
    );
  }
  getBatch(
    batchUuid: string,
    page = 1,
  ): Observable<PersonImportPreviewResponse> {
    return this.http.get<PersonImportPreviewResponse>(
      `/api/personas/importaciones/${encodeURIComponent(batchUuid)}`,
      {
        params: {
          page: String(page),
        },
      },
    );
  }
  confirmBatch(
    batchUuid: string,
  ): Observable<PersonImportUploadResponse> {
    return this.http.post<PersonImportUploadResponse>(
      `/api/personas/importaciones/${encodeURIComponent(batchUuid)}/confirmar`,
      {},
    );
  }
  upload(
    file: File,
  ): Observable<PersonImportUploadResponse> {
    const formData =
      new FormData();

    formData.append(
      'archivo',
      file,
    );

    return this.http.post<PersonImportUploadResponse>(
      '/api/personas/importaciones',
      formData,
    );
  }
}
