import { Observable } from 'rxjs';
import { Persona, CreatePersonaDTO } from '../models/persona.model';

export abstract class PersonaRepository {
  abstract create(persona: CreatePersonaDTO): Observable<{data: Persona, message: string}>;
  abstract getAll(): Observable<Persona[]>;
}