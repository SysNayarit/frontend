import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PersonDetail,
  PersonListResponse,
} from './person.models';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private readonly http = inject(HttpClient);

  find(
    idPersona: string,
  ): Observable<PersonDetail> {
    return this.http.get<PersonDetail>(
      `/api/personas/${idPersona}`,
    );
  }

  list(
    page = 1,
  ): Observable<PersonListResponse> {
    return this.http.get<PersonListResponse>(
      `/api/personas?page=${page}`,
    );
  }
}
