import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PersonCreateRequest,
  PersonDetail,
  PersonListResponse,
  PersonUpdateRequest,
} from './person.models';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private readonly http = inject(HttpClient);

  create(
    payload: PersonCreateRequest,
  ): Observable<PersonDetail> {
    return this.http.post<PersonDetail>(
      '/api/personas',
      payload,
    );
  }
  update(
    idPersona: string,
    payload: PersonUpdateRequest,
  ): Observable<PersonDetail> {
    return this.http.patch<PersonDetail>(
      `/api/personas/${idPersona}`,
      payload,
    );
  }

  withdraw(
    idPersona: string,
  ): Observable<PersonDetail> {
    return this.http.post<PersonDetail>(
      `/api/personas/${idPersona}/baja`,
      {},
    );
  }

  reinstate(
    idPersona: string,
  ): Observable<PersonDetail> {
    return this.http.post<PersonDetail>(
      `/api/personas/${idPersona}/reingreso`,
      {},
    );
  }

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
