import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaFormComponent } from '../../organisms/persona-form/persona-form.component';
import { CreatePersonaUseCase } from '../../../application/use-cases/create-persona.use-case';
import { CreatePersonaDTO } from '../../../domain/models/persona.model';

@Component({
  selector: 'app-create-persona-page',
  standalone: true,
  imports: [CommonModule, PersonaFormComponent],
  templateUrl: './create-persona.page.html'
})
export class CreatePersonaPage {
  private createPersonaUseCase = inject(CreatePersonaUseCase);

  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  onRegistrarPersona(personaData: CreatePersonaDTO): void {
    this.mensajeExito = null;
    this.mensajeError = null;

this.createPersonaUseCase.execute(personaData).subscribe({
      next: (response: any) => {
        this.mensajeExito = `¡Registro exitoso! Se generó el expediente: ${response.data.num_expediente}`;
      },
      error: (error: any) => {
        console.error('Error al registrar persona:', error);
        this.mensajeError = 'Ocurrió un error al intentar registrar a la persona. Verifica la consola.';
      }
    });
    }
}