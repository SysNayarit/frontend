import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { PersonForm } from "../../forms/person-form";
import { PersonFormFieldsComponent } from "../../molecules/person-form-fields/person-form-fields.component";

export type PersonaRegisterForm = PersonForm;

@Component({
  selector: "app-persona-register-form",
  standalone: true,
  imports: [ReactiveFormsModule, PersonFormFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "contents",
  },
  template: `
    <form
      data-testid="persona-register-form"
      [formGroup]="form"
      (ngSubmit)="submitRequested.emit()"
      class="mt-8 rounded-xl border border-[#a57f2c]/30 bg-[#f7f7f5] p-6"
    >
      <p
        class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
      >
        Alta de Persona
      </p>

      <h3 class="siga-title mt-2 text-2xl font-bold text-[#611232]">
        Registrar persona
      </h3>

      <p class="mt-3 text-sm leading-6 text-[#555555]">
        Captura los datos requeridos para registrar una nueva persona en SIGA.
      </p>

      <app-person-form-fields
        [form]="form"
        mode="register"
        [nombresError]="nombresError"
        [apellidosError]="apellidosError"
        [fechaNacimientoError]="fechaNacimientoError"
      />

      @if (errorMessage) {
        <div
          data-testid="persona-register-error"
          class="mt-6 rounded-lg border border-[#9b2247]/30 bg-white p-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </div>
      }

      <p class="mt-4 text-xs text-[#555555]">
        Nombres es obligatorio. Debe capturarse al menos uno de los dos
        apellidos.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          data-testid="persona-register-submit"
          class="siga-focus rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
        >
          Guardar persona
        </button>

        <button
          type="button"
          data-testid="persona-register-cancel"
          (click)="cancelRequested.emit()"
          class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class PersonaRegisterFormComponent {
  @Input({ required: true })
  form!: PersonaRegisterForm;

  @Input()
  errorMessage: string | null = null;

  @Input()
  fechaNacimientoError: string | null = null;

  @Input()
  nombresError: string | null = null;

  @Input()
  apellidosError: string | null = null;

  @Output()
  readonly submitRequested = new EventEmitter<void>();

  @Output()
  readonly cancelRequested = new EventEmitter<void>();
}
