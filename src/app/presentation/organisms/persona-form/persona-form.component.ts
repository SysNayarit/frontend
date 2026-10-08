import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePersonaDTO } from '../../../domain/models/persona.model';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './persona-form.component.html'
})
export class PersonaFormComponent {
  @Output() formSubmit = new EventEmitter<CreatePersonaDTO>();
  
  private fb = inject(FormBuilder);

  personaForm: FormGroup = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(150)]],
    apellido_paterno: ['', [Validators.maxLength(100)]],
    apellido_materno: ['', [Validators.maxLength(100)]],
    curp: ['', [Validators.maxLength(18)]],
    rfc: ['', [Validators.maxLength(13)]],
    fecha_nacimiento: [''],
    sexo: [''],
    estado_civil: [''],
    correo_institucional: ['', [Validators.email, Validators.maxLength(254)]],
    correo_personal: ['', [Validators.email, Validators.maxLength(254)]]
  });

  onSubmit(): void {
    if (this.personaForm.valid) {
      const formValue = this.personaForm.value;
      
      // Filtrar valores nulos o vacíos para no enviarlos al backend
const cleanData = Object.fromEntries(
        Object.entries(formValue).filter(([_, v]) => v !== null && v !== '')
      ) as unknown as CreatePersonaDTO;

      this.formSubmit.emit(cleanData);
    } else {
      this.personaForm.markAllAsTouched();
    }
  }
}