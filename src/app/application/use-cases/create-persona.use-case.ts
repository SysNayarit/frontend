import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona, CreatePersonaDTO } from '../../domain/models/persona.model';
import { PersonaRepository } from '../../domain/repositories/persona.repository';

@Injectable({
  providedIn: 'root'
})
export class CreatePersonaUseCase {
  constructor(private personaRepository: PersonaRepository) {}

  execute(persona: CreatePersonaDTO): Observable<{data: Persona, message: string}> {
    return this.personaRepository.create(persona);
  }
}