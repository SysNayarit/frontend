import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona, CreatePersonaDTO } from '../../domain/models/persona.model';
import { PersonaRepository } from '../../domain/repositories/persona.repository';

@Injectable({
  providedIn: 'root'
})
export class PersonaHttpRepository extends PersonaRepository {
  private readonly API_URL = 'http://127.0.0.1:8000/api/personas'; 

  constructor(private http: HttpClient) {
    super();
  }

  create(persona: CreatePersonaDTO): Observable<{data: Persona, message: string}> {
    return this.http.post<{data: Persona, message: string}>(this.API_URL, persona);
  }

  getAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.API_URL);
  }
}