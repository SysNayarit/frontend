import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona } from '../../domain/models/persona.model';
import { PersonaRepository } from '../../domain/repositories/persona.repository';

@Injectable({
  providedIn: 'root'
})
export class GetPersonasUseCase {
  private readonly personaRepository = inject(PersonaRepository);

  execute(): Observable<Persona[]> {
    return this.personaRepository.getAll();
  }
}