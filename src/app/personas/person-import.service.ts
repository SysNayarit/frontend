import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PersonImportUploadResponse,
} from './person-import.models';

@Injectable({
  providedIn: 'root',
})
export class PersonImportService {
  private readonly http = inject(HttpClient);

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
